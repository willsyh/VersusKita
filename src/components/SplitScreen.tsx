"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** True when the screen is taller than wide (phone held upright). */
export function usePortrait() {
  const [portrait, setPortrait] = useState(true);
  useEffect(() => {
    const mq = matchMedia("(orientation: portrait)");
    const update = () => setPortrait(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return portrait;
}

interface Props {
  p1: React.ReactNode;
  p2: React.ReactNode;
  /** Shown over the seam between both halves. */
  center?: React.ReactNode;
  className?: string;
  p1ClassName?: string;
  p2ClassName?: string;
}

/**
 * Two-player layout for one device.
 * Portrait (phone): Player 2 on top, rotated 180° so they can read it from across the table.
 * Landscape (tablet/desktop): Player 1 left, Player 2 right.
 */
export default function SplitScreen({ p1, p2, center, className, p1ClassName, p2ClassName }: Props) {
  return (
    <div className={cn("relative flex h-full w-full portrait:flex-col", className)}>
      <div className={cn("relative flex-1 overflow-hidden portrait:order-1 portrait:rotate-180 landscape:order-2", p2ClassName)}>{p2}</div>
      <div className={cn("relative flex-1 overflow-hidden portrait:order-2 landscape:order-1", p1ClassName)}>{p1}</div>
      {center && <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">{center}</div>}
    </div>
  );
}

/** Keyboard fallback for desktop: Player 1 = A / Space-left keys, Player 2 = L / Enter. */
export function useTapKeys(onTap: (p: 1 | 2) => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === "a" || k === "s" || k === "d") onTap(1);
      if (k === "l" || k === "k" || k === "j") onTap(2);
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [onTap, enabled]);
}
