"use client";

import { useStore } from "./store";

// Synthesized sound effects via Web Audio, so no audio files are needed.
let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const AC = w.AudioContext ?? w.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, duration = 0.1, type: OscillatorType = "sine", volume = 0.15, delay = 0) {
  if (!useStore.getState().settings.sound) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export const sfx = {
  tap: () => tone(520, 0.05, "triangle", 0.08),
  place: () => tone(330, 0.08, "square", 0.06),
  flip: () => tone(700, 0.05, "sine", 0.08),
  tick: () => tone(880, 0.06, "sine", 0.1),
  go: () => tone(1200, 0.2, "square", 0.1),
  bounce: () => tone(440, 0.04, "square", 0.06),
  wrong: () => tone(140, 0.25, "sawtooth", 0.1),
  correct: () => {
    tone(660, 0.08, "triangle", 0.12);
    tone(990, 0.12, "triangle", 0.12, 0.08);
  },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "triangle", 0.14, i * 0.11)),
};

export function vibrate(pattern: number | number[]) {
  if (!useStore.getState().settings.vibration) return;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
}
