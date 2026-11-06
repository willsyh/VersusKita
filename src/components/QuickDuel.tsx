"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { GameProps, PlayerId } from "@/games/types";
import SplitScreen from "./SplitScreen";
import { sfx } from "@/lib/sound";
import { cn, other } from "@/lib/utils";

export interface DuelQuestion {
  prompt: React.ReactNode;
  /** Is the statement true? Players answer Benar / Salah. */
  truth: boolean;
}

interface Props extends Pick<GameProps, "players" | "onFinish"> {
  generate: () => DuelQuestion;
  instruction: string;
  target?: number;
  timePerQ?: number;
}

/**
 * Split-screen speed duel: both see the same statement and tap Benar or Salah.
 * First correct answer scores. A wrong answer locks you out for that question.
 * Reusable for any true/false style game (math, colors, flags, ...).
 */
export default function QuickDuel({ players, onFinish, generate, instruction, target = 7, timePerQ = 6000 }: Props) {
  const [q, setQ] = useState<DuelQuestion>(generate);
  const [qNo, setQNo] = useState(0);
  const [scores, setScores] = useState<Record<PlayerId, number>>({ 1: 0, 2: 0 });
  const [locked, setLocked] = useState<Record<PlayerId, boolean>>({ 1: false, 2: false });
  const [result, setResult] = useState<{ by: PlayerId | null } | null>(null);
  const scoresRef = useRef(scores);
  const lockedRef = useRef(locked);
  const doneRef = useRef(false);

  const next = useCallback(() => {
    if (doneRef.current) return;
    lockedRef.current = { 1: false, 2: false };
    setLocked(lockedRef.current);
    setResult(null);
    setQ(generate());
    setQNo((n) => n + 1);
  }, [generate]);

  // Time limit per question.
  useEffect(() => {
    if (result) return;
    const t = setTimeout(() => setResult({ by: null }), timePerQ);
    return () => clearTimeout(t);
  }, [qNo, result, timePerQ]);

  // Short pause after each question.
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(next, 900);
    return () => clearTimeout(t);
  }, [result, next]);

  const answer = (p: PlayerId, says: boolean) => {
    if (result || lockedRef.current[p] || doneRef.current) return;
    if (says === q.truth) {
      sfx.correct();
      scoresRef.current = { ...scoresRef.current, [p]: scoresRef.current[p] + 1 };
      setScores(scoresRef.current);
      setResult({ by: p });
      if (scoresRef.current[p] >= target) {
        doneRef.current = true;
        onFinish({ winner: p, detail: `Skor ${scoresRef.current[1]} – ${scoresRef.current[2]}` });
      }
    } else {
      sfx.wrong();
      lockedRef.current = { ...lockedRef.current, [p]: true };
      setLocked(lockedRef.current);
      if (lockedRef.current[other(p)]) setResult({ by: null });
    }
  };

  const half = (p: PlayerId) => (
    <div className={cn("flex h-full flex-col items-center justify-center gap-4 p-4", p === 1 ? "bg-p1/10" : "bg-p2/10")}>
      <div className="flex w-full max-w-sm items-center justify-between text-sm font-semibold">
        <span className={p === 1 ? "text-p1" : "text-p2"}>
          {players[p].emoji} {players[p].name}
        </span>
        <span className="font-display text-xl font-bold tabular-nums">
          {scores[p]}/{target}
        </span>
      </div>
      <p className="text-center text-xs font-semibold uppercase tracking-wider opacity-60">{instruction}</p>
      <AnimatePresence mode="wait">
        <motion.div key={qNo} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="min-h-[3.5rem] text-center">
          {q.prompt}
        </motion.div>
      </AnimatePresence>
      <div className="grid w-full max-w-sm grid-cols-2 gap-3">
        {[true, false].map((says) => (
          <button
            key={String(says)}
            onPointerDown={(e) => {
              e.preventDefault();
              answer(p, says);
            }}
            disabled={!!result || locked[p]}
            className={cn(
              "tap-zone flex items-center justify-center gap-2 rounded-2xl py-5 font-display text-lg font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-40",
              says ? "bg-emerald-500" : "bg-rose-500",
            )}
          >
            {says ? <Check size={22} /> : <X size={22} />} {says ? "Benar" : "Salah"}
          </button>
        ))}
      </div>
      <p className="h-5 text-sm font-semibold">
        {result?.by === p && "+1 poin!"}
        {result && result.by === other(p) && "Lawan lebih cepat!"}
        {result && result.by === null && `Jawabannya: ${q.truth ? "Benar" : "Salah"}`}
        {!result && locked[p] && "Salah! Tunggu soal berikutnya"}
      </p>
    </div>
  );

  return (
    <SplitScreen
      p1={half(1)}
      p2={half(2)}
      center={
        <div className="rounded-full bg-white px-3 py-1 font-display text-sm font-bold text-slate-900 shadow-xl">
          <span className="text-p1">{scores[1]}</span> – <span className="text-p2">{scores[2]}</span>
        </div>
      }
    />
  );
}
