"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps, PlayerId } from "../types";
import SplitScreen, { usePortrait, useTapKeys } from "@/components/SplitScreen";
import TapZone from "@/components/TapZone";
import { CountdownBadge, useCountdown } from "@/components/Countdown";
import { sfx } from "@/lib/sound";

const PULL = 0.04; // rope movement per tap (1 = reach the goal)

export default function TugOfWar({ players, onFinish }: GameProps) {
  const count = useCountdown(3);
  const portrait = usePortrait();
  // -1 = fully at Player 1's side, +1 = fully at Player 2's side.
  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  const doneRef = useRef(false);
  const running = count === 0 && !doneRef.current;

  const tap = useCallback(
    (p: PlayerId) => {
      if (count !== 0 || doneRef.current) return;
      sfx.tap();
      posRef.current = Math.max(-1, Math.min(1, posRef.current + (p === 1 ? -PULL : PULL)));
      setPos(posRef.current);
      if (Math.abs(posRef.current) >= 1) {
        doneRef.current = true;
        onFinish({ winner: posRef.current < 0 ? 1 : 2 });
      }
    },
    [count, onFinish],
  );
  useTapKeys(tap, running);

  // Slight drift back to the center so both players must keep tapping.
  useEffect(() => {
    if (count !== 0) return;
    const id = setInterval(() => {
      if (doneRef.current) return;
      posRef.current *= 0.995;
      setPos(posRef.current);
    }, 50);
    return () => clearInterval(id);
  }, [count]);

  const zone = (p: PlayerId) => (
    <TapZone player={p} onTap={() => tap(p)} disabled={!running} className="!items-start !justify-center landscape:!items-center landscape:!justify-start landscape:pt-12">
      {/* Kept beside the rope (portrait) or above it (landscape) so it never overlaps. */}
      <div className="flex max-w-[42%] flex-col items-center gap-1 text-center landscape:max-w-none">
        <span className="text-5xl">{players[p].emoji}</span>
        <span className={`font-display text-xl font-bold ${p === 1 ? "text-p1" : "text-p2"}`}>{players[p].name}</span>
        <span className="text-sm font-semibold uppercase tracking-widest opacity-60">{count > 0 ? "Pegang talinya..." : "TARIK! 💪 Tap terus!"}</span>
        <span className="hidden text-xs opacity-50 landscape:md:block">Keyboard: {p === 1 ? "A" : "L"}</span>
      </div>
    </TapZone>
  );

  // Knot position as a % along the rope axis.
  const offset = pos * 42;
  const knotStyle = portrait ? { top: `${50 - offset}%`, left: "50%" } : { left: `${50 + offset}%`, top: "50%" };

  return (
    <SplitScreen
      p1={zone(1)}
      p2={zone(2)}
      center={
        <div className="absolute inset-0">
          {/* Goal lines */}
          <div className={portrait ? "absolute inset-x-6 top-[8%] h-1 rounded bg-p2" : "absolute inset-y-6 right-[8%] w-1 rounded bg-p2"} />
          <div className={portrait ? "absolute inset-x-6 bottom-[8%] h-1 rounded bg-p1" : "absolute inset-y-6 left-[8%] w-1 rounded bg-p1"} />
          {/* Rope */}
          <div
            className={
              portrait
                ? "absolute bottom-0 left-1/2 top-0 w-3 -translate-x-1/2 bg-[repeating-linear-gradient(45deg,#a16207_0_6px,#ca8a04_6px_12px)]"
                : "absolute left-0 right-0 top-1/2 h-3 -translate-y-1/2 bg-[repeating-linear-gradient(45deg,#a16207_0_6px,#ca8a04_6px_12px)]"
            }
          />
          {/* Knot */}
          <motion.div
            style={{ x: "-50%", y: "-50%" }}
            className="absolute grid h-14 w-14 place-items-center rounded-full bg-white text-3xl shadow-xl ring-4 ring-yellow-500"
            animate={knotStyle}
            transition={{ type: "spring", stiffness: 600, damping: 30 }}
          >
            🚩
          </motion.div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <CountdownBadge count={count} />
          </div>
        </div>
      }
    />
  );
}
