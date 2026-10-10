/* iPhone-style notification chimes, synthesised with Web Audio (no audio files). */

let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Call from a click/tap/keypress so the browser lets us play sound. */
export function unlockAudio() {
  const c = audio();
  if (c && c.state === "suspended") void c.resume();
  return !!c;
}

export function audioReady() {
  return !!ctx && ctx.state === "running";
}

/* A short generated room reverb, so the notes get the soft echo of iOS "Rebound" */
let verb: { input: GainNode } | null = null;
function reverb(c: AudioContext) {
  if (verb) return verb.input;
  const len = Math.floor(c.sampleRate * 1.1);
  const ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  const conv = c.createConvolver();
  conv.buffer = ir;
  const wet = c.createGain();
  wet.gain.value = 0.4;
  const input = c.createGain();
  input.connect(conv).connect(wet).connect(c.destination);
  verb = { input };
  return input;
}

/** One soft, rounded mallet note (quick attack, gentle decay), sent dry + to the reverb. */
function note(c: AudioContext, freq: number, start: number, gain: number, decay = 0.42) {
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, start);
  out.gain.exponentialRampToValueAtTime(gain, start + 0.006);
  out.gain.exponentialRampToValueAtTime(0.0001, start + decay);
  out.connect(c.destination);
  out.connect(reverb(c));
  // mostly a pure tone, a touch of octave and a tiny click of "mallet"
  for (const [mult, level, fade] of [[1, 1, decay], [2, 0.08, decay * 0.5], [4.2, 0.05, 0.03]] as const) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * mult, start);
    g.gain.setValueAtTime(level, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + fade);
    osc.connect(g).connect(out);
    osc.start(start);
    osc.stop(start + decay + 0.05);
  }
}

/** Two soft notes with a reverb echo, in the style of the iOS 17 "Rebound" tone. */
export function playChime() {
  const c = audio();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const t = c.currentTime + 0.01;
  note(c, 1174.7, t, 0.38); // D6
  note(c, 1568, t + 0.085, 0.3, 0.55); // G6, a little quieter: the "rebound"
}

/** Lower, falling pair for "lead lost". */
export function playLost() {
  const c = audio();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const t = c.currentTime + 0.01;
  note(c, 587.3, t, 0.34, 0.5); // D5
  note(c, 440, t + 0.13, 0.28, 0.8); // A4
}
