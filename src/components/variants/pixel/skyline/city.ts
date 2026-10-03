/**
 * Deterministic city generation for the hero skyline (seeded, so server and
 * client render the same city).
 */

export const ROW = 5; // px between scanlines
export const LINE = 2; // scanline thickness
export const RADIUS = 150; // spotlight radius in px
export const NAMES = ["LEKKI PH1", "IKOYI", "BANANA ISLAND", "VICTORIA ISLAND", "EKO ATLANTIC"];

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** Deterministic PRNG for the animation layers (no Math.random anywhere). */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Building {
  x0: number;
  x1: number;
  top: number; // highest point, px from the ground (incl. spire)
  body: number; // roof height without spire
  name: string;
}
export interface Seg {
  x0: number;
  x1: number;
  y: number;
  row: number;
  dir: 1 | -1;
  b: number;
}
export interface Gap {
  x: number;
  y: number;
  w: number;
  b: number;
}

export function buildCity(width: number, height: number) {
  const rand = rng(42);
  const buildings: Building[] = [];
  const profile = new Float32Array(Math.ceil(width));
  const owner = new Int16Array(Math.ceil(width)).fill(-1);

  let x = 0;
  while (x < width) {
    const w = Math.round(22 + rand() * 64);
    const t = x / width;
    const base = 0.16 + 0.7 * Math.pow(t, 1.15);
    const cluster = Math.exp(-Math.pow((t - 0.62) / 0.12, 2)) * 0.18;
    const body = Math.max(18, height * (base + cluster) * (0.55 + rand() * 0.45));
    const setback = rand() > 0.55;
    const spire = rand() > 0.78;
    const idx = buildings.length;
    let top = body;
    for (let i = x; i < Math.min(width, x + w); i++) {
      const fromEdge = Math.min(i - x, x + w - 1 - i);
      let h = body;
      if (setback) h = fromEdge < w * 0.18 ? body - 22 : fromEdge < w * 0.3 ? body - 10 : body;
      if (spire && Math.abs(i - (x + w / 2)) < 2) h = body + 26 + rand() * 6;
      if (h > profile[i]) {
        profile[i] = h;
        owner[i] = idx;
      }
      top = Math.max(top, h);
    }
    buildings.push({ x0: x, x1: Math.min(width, x + w), top, body, name: NAMES[idx % NAMES.length] });
    x += w + (rand() > 0.72 ? 4 : 1);
  }

  const segs: Seg[] = [];
  const gaps: Gap[] = [];
  const rows = Math.floor(height / ROW);
  for (let r = 0; r < rows; r++) {
    const y = height - r * ROW - LINE;
    const fromGround = r * ROW;
    let start = -1;
    for (let i = 0; i <= width; i++) {
      const inside = i < width && profile[i] > fromGround && owner[i] >= 0;
      const sameOwner = start >= 0 && i < width && owner[i] === owner[start];
      if (inside && start < 0) start = i;
      else if (start >= 0 && (!inside || !sameOwner)) {
        const b = owner[start];
        const bld = buildings[b];
        const isFloorLine = r % 4 === 0 || fromGround > bld.body - ROW * 2;
        let s = start;
        for (let gx = start + 5; gx < i - 3; gx += 7) {
          if (!isFloorLine) {
            segs.push({ x0: s, x1: gx, y, row: r, dir: r % 2 ? 1 : -1, b });
            gaps.push({ x: gx, y, w: 2, b });
            s = gx + 2;
          }
        }
        segs.push({ x0: s, x1: i, y, row: r, dir: r % 2 ? 1 : -1, b });
        start = inside ? i : -1;
      }
    }
  }
  return { buildings, segs, gaps };
}

export type City = ReturnType<typeof buildCity>;

/** Mix two hex colours, returning an rgb() string. */
export function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** Draw a pixel sprite (rows of "X"/"." strings) at integer coords. */
export function sprite(ctx: CanvasRenderingContext2D, rows: string[], x: number, y: number, p: number, color: string) {
  ctx.fillStyle = color;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      if (row[c] === "X") ctx.fillRect(Math.round(x + c * p), Math.round(y + r * p), p, p);
    }
  }
}
