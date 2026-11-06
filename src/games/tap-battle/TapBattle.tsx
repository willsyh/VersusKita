"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps, PlayerId } from "../types";
import SplitScreen, { useTapKeys } from "@/components/SplitScreen";
import TapZone from "@/components/TapZone";
import { CountdownBadge, useCountdown } from "@/components/Countdown";
import { sfx } from "@/lib/sound";

const DURATION = 10_000;

export default function TapBattle({ players, onFinish }: GameProps) {
  const count = useCountdown(3);
  const [taps, setTaps] = useState<Record<PlayerId, number>>({ 1: 0, 2: 0 });
  const [left, setLeft] = useState(DURATION);
  const tapsRef = useRef(taps);
  const running = count === 0 && left > 0;

  useEffect(() => {
    if (count !== 0) return;
    const start = performance.now();
    const id = setInterval(() => {
      const remaining = Math.max(0, DURATION - (performance.now() - start));
      setLeft(remaining);
      if (remaining === 0) {
        clearInterval(id);
        const t = tapsRef.current;
        onFinish({ winner: t[1] === t[2] ? null : t[1] > t[2] ? 1 : 2, detail: `${t[1]} vs ${t[2]} tap` });
      }
    }, 50);
    return () => clearInterval(id);
  }, [count, onFinish]);

  const tap = useCallback(
    (p: PlayerId) => {
      if (!running) return;
      sfx.tap();
      tapsRef.current = { ...tapsRef.current, [p]: tapsRef.current[p] + 1 };
      setTaps(tapsRef.current);
    },
    [running],
  );
  useTapKeys(tap, running);

  const zone = (p: PlayerId) => (
    <TapZone player={p} onTap={() => tap(p)} disabled={!running}>
      <span className="text-4xl">{players[p].emoji}</span>
      <span className={`font-display text-lg font-semibold ${p === 1 ? "text-p1" : "text-p2"}`}>{players[p].name}</span>
      <motion.span key={taps[p]} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-display text-7xl font-bold tabular-nums sm:text-8xl">
        {taps[p]}
      </motion.span>
      <span className="text-sm font-semibold uppercase tracking-widest opacity-60">
        {count > 0 ? "Siap-siap..." : left > 0 ? "TAP! TAP! TAP!" : "Selesai"}
      </span>
      <span className="hidden text-xs opacity-50 landscape:md:block">Keyboard: {p === 1 ? "A" : "L"}</span>
    </TapZone>
  );

  return (
    <SplitScreen
      p1={zone(1)}
      p2={zone(2)}
      center={
        count > 0 ? (
          <CountdownBadge count={count} />
        ) : (
          <div className="rounded-full bg-white px-4 py-2 font-display text-2xl font-bold tabular-nums text-slate-900 shadow-xl">
            {(left / 1000).toFixed(1)}s
          </div>
        )
      }
    />
  );
}
