"use client";

import { useEffect, useRef } from "react";

/**
 * Halftone city skyline drawn as a dot matrix. A handful of "windows" glow
 * brand-green and fade out again: leads being picked up across the city.
 */

const GAP = 8;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Building {
  x0: number;
  x1: number;
  top: number; // in rows from the ground
  spire: boolean;
  stepped: boolean;
}

function buildSkyline(cols: number, rows: number): Building[] {
  const rand = mulberry32(7);
  const out: Building[] = [];
  let x = 0;
  while (x < cols) {
    const w = 4 + Math.floor(rand() * 9);
    const centre = 1 - Math.abs((x + w / 2) / cols - 0.5) * 1.3; // taller towards the middle
    const h = Math.max(3, Math.floor(rows * (0.18 + rand() * 0.55) * Math.max(0.35, centre)));
    out.push({ x0: x, x1: x + w, top: h, spire: rand() > 0.82, stepped: rand() > 0.6 });
    x += w + (rand() > 0.7 ? 1 : 0);
  }
  return out;
}

export function DotSkyline({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    let width = 0;
    let height = 0;
    let cells: { x: number; y: number; r: number; window: boolean }[] = [];
    let glows: { i: number; born: number; life: number }[] = [];

    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = Math.ceil(width / GAP);
      const rows = Math.ceil(height / GAP);
      const skyline = buildSkyline(cols, rows);
      const heightAt = new Array<number>(cols).fill(0);
      const meta = new Array<Building | null>(cols).fill(null);
      for (const b of skyline) {
        for (let c = b.x0; c < Math.min(b.x1, cols); c++) {
          let top = b.top;
          if (b.stepped && (c - b.x0 < 2 || b.x1 - c <= 2)) top -= 3;
          if (b.spire && c === Math.floor((b.x0 + b.x1) / 2)) top += 6;
          heightAt[c] = top;
          meta[c] = b;
        }
      }

      cells = [];
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const fromGround = rows - r;
          const x = c * GAP + GAP / 2;
          const y = r * GAP + GAP / 2;
          if (fromGround <= heightAt[c]) {
            const b = meta[c]!;
            const edge = c === b.x0 || c === b.x1 - 1 || fromGround === heightAt[c];
            const isWindow = !edge && (c - b.x0) % 2 === 1 && fromGround % 3 !== 0;
            cells.push({ x, y, r: edge ? 1.7 : isWindow ? 1.15 : 1.45, window: isWindow });
          } else {
            // Atmospheric halftone that thins out towards the sky
            const t = 1 - (fromGround - heightAt[c]) / 9;
            if (t > 0) cells.push({ x, y, r: 0.35 + t * 0.7, window: false });
          }
        }
      }
      glows = [];
    };

    const windows = () => cells.map((c, i) => (c.window ? i : -1)).filter((i) => i >= 0);
    let windowIdx: number[] = [];

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#18181b";
      for (const c of cells) {
        ctx.globalAlpha = c.window ? 0.28 : c.r > 1 ? 0.78 : 0.22;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion && windowIdx.length) {
        if (glows.length < 14 && Math.random() < 0.12) {
          glows.push({ i: windowIdx[Math.floor(Math.random() * windowIdx.length)], born: now, life: 1600 + Math.random() * 2200 });
        }
        glows = glows.filter((g) => now - g.born < g.life);
        ctx.fillStyle = "#15803d";
        for (const g of glows) {
          const p = (now - g.born) / g.life;
          const c = cells[g.i];
          ctx.globalAlpha = Math.sin(p * Math.PI);
          ctx.beginPath();
          ctx.arc(c.x, c.y, 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      if (visible) draw(now);
      raf = requestAnimationFrame(loop);
    };

    layout();
    windowIdx = windows();
    if (reduceMotion) draw(0);
    else raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => {
      layout();
      windowIdx = windows();
      if (reduceMotion) draw(0);
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
