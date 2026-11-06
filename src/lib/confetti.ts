"use client";

import confetti from "canvas-confetti";
import { toHex } from "./colors";

export function celebrate(color: string) {
  const colors = [toHex(color), "#ffffff", "#facc15"];
  const end = Date.now() + 1400;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors, zIndex: 100 });
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors, zIndex: 100 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 120, spread: 100, origin: { y: 0.45 }, colors, zIndex: 100 });
}
