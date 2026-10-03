"use client";

import { useEffect, useRef } from "react";
import { buildCity, LINE, mix, mulberry32, RADIUS, sprite, type City } from "./city";
import { useT } from "../i18n";

export type LabMode = "drone" | "ripples" | "arcs" | "daynight" | "life" | "drone-life";

/**
 * The hero scanline skyline plus one animation layer per `mode`. The base
 * behaviour (build-in, cursor spotlight/ripple/tag, tap) is the
 * same as the live hero; each mode adds a story layer on top.
 */

type Ripple = { x: number; y: number; t: number; life: number };
type Arc = { id: number; from: number; to: number; t: number; hit?: boolean; done?: boolean };
type Walker = { x: number; speed: number; dir: 1 | -1; visit: number; stopUntil: number; doorX: number };
type Bird = { x: number; y: number; phase: number };
type Car = { x: number; dir: 1 | -1; t: number };

const FROZEN = 1e6; // fixed clock for the reduced-motion composed frame
const BG = "#f4f4f2";

/* Pixel sprites ------------------------------------------------------- */

const PERSON_A = [".X.", "XXX", "XXX", ".X.", ".X.", "X.X", "X.X"];
const PERSON_B = [".X.", "XXX", "XXX", ".X.", ".X.", ".X.", "XX."];
const PERSON_STAND = [".X.", "XXX", "XXX", ".X.", ".X.", ".X.", ".X."];
const BIRD_UP = ["X...X", ".X.X.", "..X.."];
const BIRD_DOWN = [".....", "XX.XX", "..X.."];
const CAR = ["...XXXXX....", ".XXXXXXXXXX.", "XXXXXXXXXXXX", ".XX......XX."];
const CAR_WINDOWS = ["....X.X.....", "............", "............", "............"];
const SPACIA_MARK = ["....X....", "....X....", "...XXX...", ".XXXXXXX.", "XXXXXXXXX", ".XXXXXXX.", "...XXX...", "....X....", "....X...."];

function drawDrone(ctx: CanvasRenderingContext2D, x: number, y: number, now: number, calling: boolean, tilt: number) {
  const p = 2;
  const ox = Math.round(x - 9 * p);
  const oy = Math.round(y - 3 * p);
  const spin = Math.floor(now / 45) % 2 === 0;
  const lead = tilt > 0.15 ? 1 : tilt < -0.15 ? -1 : 0;
  // rotors (spin illusion: alternate long / short blades)
  ctx.globalAlpha = 0.55;
  const blade = spin ? "XXXXX" : ".XXX.";
  sprite(ctx, [blade], ox + 0 * p, oy + (lead < 0 ? -1 : 0) * p, p, "#14231d");
  sprite(ctx, [blade], ox + 13 * p, oy + (lead > 0 ? -1 : 0) * p, p, "#14231d");
  ctx.globalAlpha = 1;
  // masts, arms, body, skids
  sprite(
    ctx,
    [
      "..................",
      "..X..........X....",
      "..XXXX.XXX.XXXX...",
      "......XXXXX.......",
      "......XXXXX.......",
      ".....X.....X......",
      "....XX.....XX.....",
    ],
    ox,
    oy,
    p,
    "#14231d",
  );
  // status LED
  const on = calling || Math.floor(now / 500) % 3 !== 0;
  if (on) {
    ctx.fillStyle = "#22c55e";
    ctx.shadowColor = "#22c55e";
    ctx.shadowBlur = calling ? 8 : 4;
    ctx.fillRect(ox + 8 * p, oy + 3 * p, p, p);
    ctx.shadowBlur = 0;
  }
}

function pixelDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, cut?: { dx: number; r: number }) {
  const p = 2;
  ctx.fillStyle = color;
  for (let y = -r; y <= r; y += p) {
    for (let x = -r; x <= r; x += p) {
      if (x * x + y * y > r * r) continue;
      if (cut && (x - cut.dx) ** 2 + y * y < cut.r * cut.r) continue;
      ctx.fillRect(Math.round(cx + x), Math.round(cy + y), p, p);
    }
  }
}

function chip(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "600 9px ui-monospace, SFMono-Regular, Menlo, monospace";
  const tw = ctx.measureText(text).width;
  const bx = Math.round(x - tw / 2 - 5);
  ctx.fillStyle = "#14231d";
  ctx.fillRect(bx, Math.round(y - 14), Math.round(tw + 10), 14);
  ctx.fillStyle = "#86efac";
  ctx.fillText(text, bx + 5, Math.round(y - 4));
  ctx.restore();
}

export function LabSkyline({ mode, className }: { mode: LabMode; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const hasDrone = mode === "drone" || mode === "drone-life";
  const hasLife = mode === "life" || mode === "drone-life";
  const combo = mode === "drone-life";
  const ref = useRef<HTMLCanvasElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  // canvas labels follow the language without restarting the animation
  const words = useT().skyline;
  const wordsRef = useRef(words);
  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = ref.current;
    const tag = tagRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !tag || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let data: City = buildCity(1, 1);
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = false;
    let t0: number | null = null;
    let last = 0;

    // Pointer / spotlight (same as the live hero)
    const target = { x: -9999, y: -9999 };
    const spot = { x: -9999, y: -9999 };
    let active = false;
    let intensity = 0;
    let touchTimer: ReturnType<typeof setTimeout> | undefined;
    let hovered = -1;
    let hoverStart = 0;
    const tagPos = { x: 0, y: 0 };

    // Shared story state
    let lit: number[] = [];
    let ripples: Ripple[] = [];
    let modeTag: { b: number; start: number; until: number } | null = null;
    let candidates: number[] = [];
    let rand = mulberry32(11);

    // Mode state
    const drone = { x: 0, y: 0, vx: 0, vy: 0, target: -1, calling: false, phaseStart: 0, ready: false };
    let ping: { b: number; t: number } | null = null;
    let nextEvent = 0;
    let arcs: Arc[] = [];
    let arcId = 0;
    let hub = -1;
    let hubPulse = 0;
    let gapTh: number[] = [];
    let walkers: Walker[] = [];
    let birds: Bird[] = [];
    let flockAt = 0;
    let car: Car | null = null;
    let carAt = 0;
    let lastPing = -1;

    const bMid = (b: number) => (data.buildings[b].x0 + data.buildings[b].x1) / 2;
    const roofY = (b: number) => h - data.buildings[b].body;
    const topY = (b: number) => h - data.buildings[b].top;
    const buildingAt = (px: number) => data.buildings.findIndex((b) => px >= b.x0 && px < b.x1);
    const pick = (avoid = -1, near?: number) => {
      for (let i = 0; i < 20; i++) {
        const b = candidates[Math.floor(rand() * candidates.length)];
        if (b === avoid) continue;
        if (near !== undefined) {
          const d = Math.abs(bMid(b) - near);
          if (d < 140 || d > Math.max(420, w * 0.45)) continue;
        }
        return b;
      }
      return candidates[0];
    };
    const callAt = (b: number, now: number, withRipple = true) => {
      lit[b] = 1;
      modeTag = { b, start: now, until: now + 2600 };
      if (withRipple) ripples.push({ x: bMid(b), y: roofY(b), t: now, life: 1700 });
    };

    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      data = buildCity(w, h);
      rand = mulberry32(11);
      lit = data.buildings.map(() => 0);
      candidates = data.buildings
        .map((b, i) => ({ b, i }))
        .filter(({ b }) => b.x1 - b.x0 >= 28 && b.body > h * 0.22 && b.x0 > 20 && b.x1 < w - 20)
        .map(({ i }) => i);
      if (!candidates.length) candidates = data.buildings.map((_, i) => i);
      ripples = [];
      arcs = [];
      modeTag = null;
      // SpaciaOS hub: tallest tower in the mid-town cluster
      hub = candidates.reduce((best, i) => {
        const t = bMid(i) / w;
        if (t < 0.4 || t > 0.8) return best;
        return best < 0 || data.buildings[i].top > data.buildings[best].top ? i : best;
      }, -1);
      if (hub < 0) hub = candidates[Math.floor(candidates.length / 2)];
      // Night windows: a sparse, deterministic subset lights at staggered thresholds
      const gr = mulberry32(5);
      gapTh = data.gaps.map(() => (gr() < 0.32 ? 0.2 + gr() * 0.7 : 2));
      // Street life
      const lr = mulberry32(9);
      walkers = Array.from({ length: w < 640 ? 3 : 5 }, (_, i) => ({
        x: ((i + 0.3) / (w < 640 ? 3 : 5)) * w,
        speed: 0.016 + lr() * 0.012,
        dir: (lr() > 0.5 ? 1 : -1) as 1 | -1,
        visit: -1,
        stopUntil: 0,
        doorX: 0,
      }));
      birds = [];
      car = null;
      carAt = performance.now() + 2500;
      flockAt = performance.now() + 800;
      drone.ready = false;
    };

    /* Updates per mode ------------------------------------------------- */

    const updateDrone = (now: number, dt: number) => {
      if (!drone.ready) {
        drone.target = pick();
        drone.x = reduce ? bMid(drone.target) : -40;
        drone.y = reduce ? topY(drone.target) - 40 : h * 0.3;
        drone.vx = drone.vy = 0;
        drone.calling = reduce;
        drone.phaseStart = now;
        drone.ready = true;
        if (reduce) {
          lit[drone.target] = 1;
          ripples.push({ x: bMid(drone.target), y: roofY(drone.target), t: now - 600, life: 1700 });
        }
      }
      const summoned = intensity > 0.3;
      let tx: number;
      let ty: number;
      if (summoned) {
        const b = buildingAt(spot.x);
        tx = Math.min(Math.max(spot.x, 24), w - 24);
        const roof = b >= 0 ? topY(b) : h;
        ty = Math.max(20, Math.min(spot.y - 10, roof - 38));
        drone.calling = false;
      } else {
        tx = bMid(drone.target);
        ty = Math.max(20, topY(drone.target) - 40);
      }
      if (!reduce) {
        // critically damped spring towards the target
        const k = summoned ? 0.00006 : 0.000022;
        const c = 2 * Math.sqrt(k);
        for (let s = 0; s < dt; s += 8) {
          const step = Math.min(8, dt - s);
          drone.vx += ((tx - drone.x) * k - drone.vx * c) * step;
          drone.vy += ((ty - drone.y) * k - drone.vy * c) * step;
          drone.x += drone.vx * step;
          drone.y += drone.vy * step;
        }
      }
      if (summoned) return;
      const dist = Math.hypot(tx - drone.x, ty - drone.y);
      const speed = Math.hypot(drone.vx, drone.vy);
      if (!drone.calling && dist < 6 && speed < 0.03) {
        drone.calling = true;
        drone.phaseStart = now;
        callAt(drone.target, now);
      }
      if (drone.calling) {
        lit[drone.target] = 1;
        if (!reduce && now - drone.phaseStart > 2400) {
          drone.calling = false;
          drone.target = pick(drone.target, bMid(drone.target));
        }
      }
    };

    const updateRipples = (now: number) => {
      if (reduce) {
        if (!ripples.length) callAt(pick(), now - 650);
        return;
      }
      if (!ping && now > nextEvent) {
        lastPing = pick(lastPing);
        ping = { b: lastPing, t: now };
        nextEvent = now + 2500;
      }
      if (ping && now - ping.t > 380) {
        callAt(ping.b, now);
        ping = null;
      }
    };

    const updateArcs = (now: number) => {
      if (reduce) {
        if (!arcs.length) {
          const from = pick(hub);
          arcs.push({ id: 0, from, to: pick(hub, bMid(from)), t: now - 1500 });
          lit[from] = 1;
        }
        return;
      }
      if (now > nextEvent && arcs.length < 3) {
        const from = pick(hub);
        let to = pick(hub);
        if (to === from) to = pick(from);
        arcs.push({ id: arcId++, from, to, t: now });
        lit[from] = Math.max(lit[from], 0.8);
        nextEvent = now + 1200;
      }
      arcs = arcs.filter((a) => {
        const age = now - a.t;
        if (age > 1000 && !a.hit) {
          a.hit = true;
          hubPulse = now;
        }
        if (age > 2000 && !a.done) {
          a.done = true;
          callAt(a.to, now, false);
        }
        return age < 2900;
      });
    };

    const nightAmount = (now: number) => {
      if (reduce) return 0.68;
      const f = (((now - (t0 ?? now)) / 20000) % 1 + 1) % 1;
      const ramp = (a: number, b: number) => Math.min(1, Math.max(0, (f - a) / (b - a)));
      const s = (v: number) => v * v * (3 - 2 * v);
      return s(ramp(0.18, 0.42)) * (1 - s(ramp(0.72, 0.95)));
    };

    const updateDayNight = (now: number) => {
      if (reduce) return;
      if (nightAmount(now) > 0.6 && now > nextEvent) {
        callAt(pick(), now, false);
        nextEvent = now + 3200;
      }
    };

    const updateLife = (now: number, dt: number) => {
      if (reduce) {
        if (!birds.length) birds = [0, 1, 2].map((i) => ({ x: w * (combo ? 0.62 : 0.3) + i * 16, y: h * 0.18 + (i % 2) * 7, phase: i }));
        return;
      }
      for (const wk of walkers) {
        if (now < wk.stopUntil) {
          if (wk.visit >= 0) lit[wk.visit] = Math.max(lit[wk.visit], 0.9);
          continue;
        }
        if (wk.visit >= 0 && wk.stopUntil > 0) {
          wk.visit = -1;
          wk.stopUntil = 0;
        }
        const nx = wk.x + wk.speed * wk.dir * dt;
        if (wk.visit >= 0 && (wk.x - wk.doorX) * (nx - wk.doorX) <= 0) {
          wk.x = wk.doorX;
          wk.stopUntil = now + 1900;
          // in the combo the drone owns the call tag; walkers just light their building
          if (combo) lit[wk.visit] = 1;
          else callAt(wk.visit, now, false);
          continue;
        }
        wk.x = nx;
        if (wk.x < -10) wk.x = w + 8;
        if (wk.x > w + 10) wk.x = -8;
      }
      if (now > nextEvent) {
        const wk = walkers[Math.floor(rand() * walkers.length)];
        if (wk.visit < 0) {
          const ahead = candidates.filter((b) => (bMid(b) - wk.x) * wk.dir > 30 && Math.abs(bMid(b) - wk.x) < 260);
          if (ahead.length) {
            wk.visit = ahead[Math.floor(rand() * ahead.length)];
            wk.doorX = bMid(wk.visit);
          }
        }
        nextEvent = now + 4200;
      }
      // birds: one restrained flock at a time
      if (!birds.length && now > flockAt) {
        const y = h * (0.1 + rand() * 0.18);
        const n = 3 + Math.floor(rand() * 2);
        // in the hero the copy sits top-left, so the flock starts past it
        const startX = combo ? w * 0.48 : -20;
        birds = Array.from({ length: n }, (_, i) => ({ x: startX - i * 14 - (i % 2) * 6, y: y + (i % 2) * 6 + i * 1.5, phase: rand() * 6 }));
      }
      birds = birds.map((b) => ({ ...b, x: b.x + 0.032 * dt }));
      if (birds.length && birds.every((b) => b.x > w + 20)) {
        birds = [];
        flockAt = now + 5000;
      }
      // a car now and then
      if (!car && now > carAt) {
        car = { x: 0, dir: rand() > 0.5 ? 1 : -1, t: now };
        carAt = now + 9000 + rand() * 4000;
      }
      if (car) {
        car.x = car.dir > 0 ? -30 + (now - car.t) * 0.11 : w + 30 - (now - car.t) * 0.11;
        if (car.x < -40 || car.x > w + 40) car = null;
      }
    };

    /* Draw ---------------------------------------------------------------- */

    const draw = (now: number) => {
      const t = reduce ? 1e9 : now - (t0 ?? now);
      const dt = Math.min(50, Math.max(0, now - last));
      last = now;

      const k = reduce ? 1 : 0.14;
      spot.x += (target.x - spot.x) * k;
      spot.y += (target.y - spot.y) * k;
      intensity += ((active ? 1 : 0) - intensity) * (reduce ? 1 : 0.08);

      if (hasDrone) updateDrone(now, dt);
      if (hasLife) updateLife(now, dt);
      if (mode === "ripples") updateRipples(now);
      else if (mode === "arcs") updateArcs(now);
      else if (mode === "daynight") updateDayNight(now);

      // decay story lighting
      const decay = reduce ? 1 : Math.exp(-dt / 900);
      for (let i = 0; i < lit.length; i++) lit[i] *= decay;
      ripples = ripples.filter((r) => now - r.t < r.life);

      ctx.clearRect(0, 0, w, h);

      // Day → night sky (only behind the skyline)
      const night = mode === "daynight" ? nightAmount(now) : 0;
      if (night > 0.01) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "rgba(9,27,33,0)");
        g.addColorStop(0.18, `rgba(9,27,33,${0.35 * night})`);
        g.addColorStop(0.5, `rgba(10,34,36,${0.85 * night})`);
        g.addColorStop(1, `rgba(12,52,42,${0.97 * night})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // a few pixel stars
        const sr = mulberry32(3);
        ctx.fillStyle = "#ecfdf5";
        for (let i = 0; i < 26; i++) {
          const sx = sr() * w;
          const sy = h * (0.22 + sr() * 0.35);
          const tw = 0.5 + 0.5 * Math.sin(now * 0.002 + i * 1.7);
          ctx.globalAlpha = night * (0.25 + 0.5 * tw) * (sr() > 0.4 ? 1 : 0);
          ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2);
        }
        ctx.globalAlpha = 1;
      }
      if (mode === "daynight") {
        const f = reduce ? 0.6 : (((now - (t0 ?? now)) / 20000) % 1 + 1) % 1;
        const cx = w * (0.08 + 0.84 * f);
        const cy = h * 0.62 - Math.sin(f * Math.PI) * h * 0.42;
        if (night < 0.5) {
          ctx.globalAlpha = (1 - night * 2) * 0.55;
          pixelDisc(ctx, cx, cy, 9, "#eab308");
        } else {
          ctx.globalAlpha = (night - 0.5) * 2 * 0.9;
          pixelDisc(ctx, cx, cy, 8, "#ecfdf5", { dx: 5, r: 7 });
        }
        ctx.globalAlpha = 1;
      }

      const dim = night > 0 ? mix("#15803d", "#86efac", night) : "#15803d";
      const bright = night > 0 ? mix("#22c55e", "#dcfce7", night) : "#22c55e";

      for (const s of data.segs) {
        const delay = s.row * 10;
        const p = Math.min(1, Math.max(0, (t - delay) / 700));
        if (p <= 0) continue;
        const ease = 1 - Math.pow(1 - p, 3);

        let inf = 0;
        if (intensity > 0.01) {
          const nx = Math.min(Math.max(spot.x, s.x0), s.x1);
          const d = Math.hypot(nx - spot.x, s.y - spot.y);
          inf = intensity * Math.max(0, 1 - d / RADIUS);
          inf *= inf;
        }
        // story ripples
        let rip = 0;
        for (const r of ripples) {
          const age = now - r.t;
          const radius = age * 0.3;
          const nx = Math.min(Math.max(r.x, s.x0), s.x1);
          const d = Math.hypot(nx - r.x, s.y - r.y);
          rip = Math.max(rip, Math.exp(-(((d - radius) / 16) ** 2)) * (1 - age / r.life));
        }
        const wave = reduce ? 0 : inf * Math.sin(s.y * 0.09 - now * 0.008) * 7 + rip * Math.sin(s.y * 0.25) * 5;
        const offset = (1 - ease) * 140 * s.dir + wave;

        const litB = lit[s.b] ?? 0;
        const l = Math.max(inf, rip, litB * 0.65);
        ctx.globalAlpha = ease * (0.5 + 0.5 * l) * (night > 0 ? 1 - night * 0.25 : 1);
        ctx.fillStyle = l > 0.3 ? bright : dim;
        ctx.fillRect(s.x0 + offset, s.y, s.x1 - s.x0, LINE);
      }

      // Window gaps: hovered tower + story-lit towers + night windows
      const b = intensity > 0.05 ? buildingAt(spot.x) : -1;
      if (b !== hovered) {
        hovered = b;
        hoverStart = now;
      }
      for (let i = 0; i < data.gaps.length; i++) {
        const g = data.gaps[i];
        let a = 0;
        let color = "#22c55e";
        if (g.b === b) a = intensity * (0.55 + 0.45 * Math.sin(g.y * 0.7 + g.x * 0.3) ** 2);
        const lb = lit[g.b] ?? 0;
        if (lb > 0.02) a = Math.max(a, lb * (0.55 + 0.45 * Math.sin(g.y * 0.7 + g.x * 0.3) ** 2));
        if (night > 0.05 && gapTh[i] < 1.5) {
          const na = Math.min(1, Math.max(0, (night - gapTh[i]) * 6));
          if (na > a) {
            a = na * 0.9;
            color = i % 3 === 0 ? "#86efac" : "#fde68a";
          }
        }
        if (a <= 0.01) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = color;
        ctx.fillRect(g.x, g.y, g.w, LINE);
      }
      ctx.globalAlpha = 1;

      // Ripple rings (thin, faint)
      for (const r of ripples) {
        const age = now - r.t;
        ctx.globalAlpha = (1 - age / r.life) * 0.5;
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(r.x, r.y, age * 0.3, Math.PI, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      /* Mode overlays --------------------------------------------------- */

      if (hasDrone && drone.ready) {
        const bob = reduce ? 0 : Math.sin(now / 320) * 1.5;
        const dx = drone.x;
        const dy = drone.y + bob;
        const under = intensity > 0.3 ? buildingAt(dx) : drone.calling ? drone.target : -1;
        if (under >= 0) {
          const roof = topY(under);
          const g = ctx.createLinearGradient(0, dy + 6, 0, roof);
          g.addColorStop(0, "rgba(34,197,94,0.28)");
          g.addColorStop(1, "rgba(34,197,94,0.04)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(dx - 4, dy + 8);
          ctx.lineTo(dx + 4, dy + 8);
          ctx.lineTo(dx + 24, roof);
          ctx.lineTo(dx - 24, roof);
          ctx.closePath();
          ctx.fill();
          // scan bar sliding down the beam
          const sp = reduce ? 0.6 : (now / 900) % 1;
          const sy = dy + 8 + (roof - dy - 8) * sp;
          const half = 4 + 20 * sp;
          ctx.fillStyle = "rgba(134,239,172,0.7)";
          ctx.fillRect(Math.round(dx - half), Math.round(sy), Math.round(half * 2), 1);
          if (intensity > 0.3) lit[under] = Math.max(lit[under], 0.9);
        }
        drawDrone(ctx, dx, dy, now, drone.calling || under >= 0, drone.vx * 20);
      }

      if (mode === "ripples" && ping) {
        const p = Math.min(1, (now - ping.t) / 380);
        const x = bMid(ping.b);
        const y = roofY(ping.b) - 70 * (1 - p * p);
        ctx.fillStyle = "#22c55e";
        ctx.shadowColor = "#22c55e";
        ctx.shadowBlur = 8;
        ctx.fillRect(Math.round(x - 2), Math.round(y - 2), 4, 4);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(Math.round(x - 0.5), Math.round(y - 22), 1, 18);
        ctx.globalAlpha = 1;
      }

      if (mode === "arcs" && hub >= 0) {
        const hx = bMid(hub);
        const hy = topY(hub) - 14;
        const pulse = reduce ? 0 : Math.max(0, 1 - (now - hubPulse) / 600);
        ctx.shadowColor = "#22c55e";
        ctx.shadowBlur = 6 + pulse * 14;
        sprite(ctx, SPACIA_MARK, hx - 9, hy - 9, 2, "#15803d");
        ctx.shadowBlur = 0;
        ctx.font = "600 9px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillStyle = "#0d4a36";
        ctx.globalAlpha = 0.85;
        ctx.fillText("SPACIA", Math.round(hx - ctx.measureText("SPACIA").width / 2), Math.round(hy - 14));
        ctx.globalAlpha = 1;

        const leg = (ax: number, ay: number, bx: number, by: number, p: number) => {
          const cx = (ax + bx) / 2;
          const cy = Math.max(8, Math.min(ay, by) - 50 - Math.abs(bx - ax) * 0.12);
          const at = (u: number) => [
            (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * cx + u * u * bx,
            (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * cy + u * u * by,
          ];
          const N = 18;
          ctx.lineWidth = 1.5;
          for (let i = 0; i < N; i++) {
            const u1 = p - (0.42 * i) / N;
            const u0 = p - (0.42 * (i + 1)) / N;
            if (u1 <= 0) break;
            const [x1, y1] = at(Math.min(1, u1));
            const [x0, y0] = at(Math.max(0, u0));
            ctx.globalAlpha = (1 - i / N) * 0.85;
            ctx.strokeStyle = "#22c55e";
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
          }
          if (p < 1) {
            const [x, y] = at(p);
            ctx.globalAlpha = 1;
            ctx.fillStyle = "#86efac";
            ctx.shadowColor = "#22c55e";
            ctx.shadowBlur = 10;
            ctx.fillRect(Math.round(x - 2), Math.round(y - 2), 4, 4);
            ctx.shadowBlur = 0;
          }
          ctx.globalAlpha = 1;
        };
        for (const a of arcs) {
          const age = now - a.t;
          const fx = bMid(a.from);
          const fy = roofY(a.from);
          const tx = bMid(a.to);
          const ty = roofY(a.to);
          const ease = (v: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, v)), 2);
          if (age < 1400) leg(fx, fy, hx, hy + 6, ease(age / 1000));
          if (age > 1000) leg(hx, hy + 6, tx, ty, ease((age - 1000) / 1000));
          if (a.id % 2 === 0 && age < 900) chip(ctx, wordsRef.current.lead, fx, fy - 6, Math.min(1, (900 - age) / 300));
          if (a.id % 2 === 0 && age > 2000) chip(ctx, wordsRef.current.agent, tx, ty - 6, Math.min(1, (2900 - age) / 300));
        }
      }

      if (hasLife) {
        // birds
        ctx.globalAlpha = 0.6;
        for (const bd of birds) {
          const up = reduce ? true : Math.floor((now / 170 + bd.phase) % 2) === 0;
          const y = bd.y + (reduce ? 0 : Math.sin(now / 600 + bd.phase) * 2);
          sprite(ctx, up ? BIRD_UP : BIRD_DOWN, bd.x, y, 2, "#27272a");
        }
        ctx.globalAlpha = 1;
        // car (behind walkers)
        if (car) {
          const cx = Math.round(car.x - 12);
          const cy = h - 8;
          ctx.fillStyle = BG;
          ctx.fillRect(cx - 2, cy - 2, 28, 10);
          const flip = (rows: string[]) => (car!.dir > 0 ? rows : rows.map((r) => r.split("").reverse().join("")));
          sprite(ctx, flip(CAR), cx, cy, 2, "#14231d");
          sprite(ctx, flip(CAR_WINDOWS), cx, cy, 2, "#d4d4d8");
          const fx = car.dir > 0 ? cx + 24 : cx;
          const g = ctx.createLinearGradient(fx, 0, fx + 34 * car.dir, 0);
          g.addColorStop(0, "rgba(253,230,138,0.55)");
          g.addColorStop(1, "rgba(253,230,138,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(fx, cy + 3);
          ctx.lineTo(fx + 34 * car.dir, cy - 1);
          ctx.lineTo(fx + 34 * car.dir, cy + 9);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#fde68a";
          ctx.fillRect(car.dir > 0 ? cx + 22 : cx, cy + 3, 2, 2);
        }
        // walkers
        for (const wk of walkers) {
          const x = Math.round(wk.x - 3);
          const y = h - 14;
          ctx.fillStyle = BG;
          ctx.fillRect(x - 1, y - 1, 8, 15);
          const stopped = now < wk.stopUntil || reduce;
          const frame = stopped ? PERSON_STAND : Math.floor(now / 200 + wk.x) % 2 ? PERSON_A : PERSON_B;
          sprite(ctx, frame, x, y, 2, "#27272a");
        }
      }

      // Tag: hover wins, otherwise the story's current call
      let tb = b;
      let since = now - hoverStart;
      let alpha = b >= 0 ? Math.min(1, intensity * 1.4) : 0;
      if (tb < 0 && modeTag && now < modeTag.until) {
        tb = modeTag.b;
        since = now - modeTag.start;
        alpha = Math.min(1, (modeTag.until - now) / 400);
      }
      if (tb >= 0) {
        const bld = data.buildings[tb];
        const secs = Math.min(3, Math.floor(since / 600));
        const wd = wordsRef.current;
        const status = secs >= 3 ? wd.connected : `${wd.calling} 00:0${secs}`;
        const text = `${bld.name} · ${wd.newLead} → ${status}`;
        if (tag.textContent !== text) tag.textContent = text;
        const tw = tag.offsetWidth;
        const tx = Math.min(Math.max(8, (bld.x0 + bld.x1) / 2 - tw / 2), w - tw - 8);
        const lift = hasDrone && tb === drone.target && drone.calling ? 80 : 34;
        const ty = Math.max(4, h - bld.top - lift);
        const snap = reduce || tag.style.opacity === "0" || tag.style.opacity === "";
        tagPos.x += (tx - tagPos.x) * (snap ? 1 : 0.2);
        tagPos.y += (ty - tagPos.y) * (snap ? 1 : 0.2);
        tag.style.transform = `translate3d(${tagPos.x}px, ${tagPos.y}px, 0)`;
      }
      tag.style.opacity = String(tb >= 0 ? alpha : 0);
    };

    const loop = (now: number) => {
      if (visible) draw(now);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf && !reduce) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const p = local(e);
      target.x = p.x;
      target.y = p.y;
      if (!active) {
        if (intensity < 0.05) {
          spot.x = p.x;
          spot.y = p.y;
        }
        active = true;
      }
      if (reduce) draw(FROZEN);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      active = false;
      if (reduce) draw(FROZEN);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      const p = local(e);
      target.x = spot.x = p.x;
      target.y = spot.y = p.y;
      active = true;
      if (reduce) draw(FROZEN);
      clearTimeout(touchTimer);
      touchTimer = setTimeout(() => {
        active = false;
        if (reduce) draw(FROZEN);
      }, 1500);
    };

    layout();
    if (reduce) draw(FROZEN);

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("pointerdown", onDown);

    const ro = new ResizeObserver(() => {
      layout();
      if (reduce) draw(FROZEN);
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (reduce) return;
        if (visible) {
          if (t0 === null) t0 = performance.now();
          start();
        } else stop();
      },
      { threshold: 0.15 },
    );
    io.observe(canvas);

    return () => {
      stop();
      clearTimeout(touchTimer);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("pointerdown", onDown);
      ro.disconnect();
      io.disconnect();
    };
  }, [mode, hasDrone, hasLife, combo]);

  return (
    <div ref={wrapRef} className={`relative touch-pan-y select-none ${className ?? ""}`}>
      <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div
        ref={tagRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 whitespace-nowrap bg-zinc-950 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#86efac] opacity-0 shadow-[0_6px_16px_-6px_rgba(13,74,54,0.6)] transition-opacity duration-200 sm:text-[11px]"
      />
    </div>
  );
}
