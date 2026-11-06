"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps, PlayerId } from "../types";
import SplitScreen, { useTapKeys } from "@/components/SplitScreen";
import TapZone from "@/components/TapZone";
import { CountdownBadge, useCountdown } from "@/components/Countdown";
import { sfx } from "@/lib/sound";

const TARGET = 10_000;
const VISIBLE_FOR = 3_000; // the timer disappears after this
const MAX = 20_000; // nobody stopped -> counted as this

const fmt = (ms: number) => (ms / 1000).toFixed(2);

export default function TenSeconds({ players, onFinish }: GameProps) {
  const count = useCountdown(3);
  const [now, setNow] = useState(0);
  const [stops, setStops] = useState<Record<PlayerId, number | null>>({ 1: null, 2: null });
  const startRef = useRef(0);
  const stopsRef = useRef(stops);
  const doneRef = useRef(false);

  const finish = useCallback(
    (s: Record<PlayerId, number | null>) => {
      if (doneRef.current) return;
      doneRef.current = true;
      const d1 = Math.abs((s[1] ?? MAX) - TARGET);
      const d2 = Math.abs((s[2] ?? MAX) - TARGET);
      const winner: PlayerId | null = d1 === d2 ? null : d1 < d2 ? 1 : 2;
      onFinish({ winner, detail: `${fmt(s[1] ?? MAX)} dtk vs ${fmt(s[2] ?? MAX)} dtk` });
    },
    [onFinish],
  );

  useEffect(() => {
    if (count !== 0) return;
    startRef.current = performance.now();
    let raf = 0;
    const loop = () => {
      const t = performance.now() - startRef.current;
      setNow(t);
      if (t >= MAX) return finish(stopsRef.current);
      if (!doneRef.current) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [count, finish]);

  const stop = useCallback(
    (p: PlayerId) => {
      if (count !== 0 || stopsRef.current[p] !== null || doneRef.current) return;
      sfx.tap();
      const t = performance.now() - startRef.current;
      stopsRef.current = { ...stopsRef.current, [p]: t };
      setStops(stopsRef.current);
      if (stopsRef.current[1] !== null && stopsRef.current[2] !== null) finish(stopsRef.current);
    },
    [count, finish],
  );
  useTapKeys(stop, count === 0);

  const bothDone = stops[1] !== null && stops[2] !== null;
  const visible = now < VISIBLE_FOR;

  const zone = (p: PlayerId) => {
    const mine = stops[p];
    return (
      <TapZone player={p} onTap={() => stop(p)} disabled={count !== 0 || mine !== null}>
        <span className="text-4xl">{players[p].emoji}</span>
        <span className={`font-display text-lg font-semibold ${p === 1 ? "text-p1" : "text-p2"}`}>{players[p].name}</span>
        <motion.span key={String(mine !== null) + String(bothDone)} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-display text-6xl font-bold tabular-nums">
          {count > 0 ? "10.00" : mine !== null ? (bothDone ? fmt(mine) : "STOP") : visible ? fmt(now) : "?.??"}
        </motion.span>
        <span className="text-sm font-semibold uppercase tracking-widest opacity-60">
          {count > 0 ? "Hitung dalam hati..." : mine !== null ? (bothDone ? `Selisih ${fmt(Math.abs(mine - TARGET))} dtk` : "Menunggu lawan...") : visible ? "Waktu berjalan..." : "Tap tepat di 10 detik!"}
        </span>
      </TapZone>
    );
  };

  return <SplitScreen p1={zone(1)} p2={zone(2)} center={<CountdownBadge count={count} />} />;
}
