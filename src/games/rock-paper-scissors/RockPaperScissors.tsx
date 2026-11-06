"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GameProps, PlayerId } from "../types";
import SplitScreen from "@/components/SplitScreen";
import { sfx } from "@/lib/sound";
import { cn } from "@/lib/utils";

type Choice = "batu" | "gunting" | "kertas";

const CHOICES: { id: Choice; emoji: string; label: string; keys: [string, string] }[] = [
  { id: "batu", emoji: "✊", label: "Batu", keys: ["a", "j"] },
  { id: "gunting", emoji: "✌️", label: "Gunting", keys: ["s", "k"] },
  { id: "kertas", emoji: "✋", label: "Kertas", keys: ["d", "l"] },
];

const BEATS: Record<Choice, Choice> = { batu: "gunting", gunting: "kertas", kertas: "batu" };
const CHANT = ["Batu...", "Gunting...", "Kertas!"];

export default function RockPaperScissors({ players, onFinish }: GameProps) {
  const [picks, setPicks] = useState<Record<PlayerId, Choice | null>>({ 1: null, 2: null });
  const [chant, setChant] = useState(-1); // -1 = choosing, 0..2 = chanting, 3 = revealed
  const both = picks[1] && picks[2];

  const pick = (p: PlayerId, c: Choice) => {
    if (picks[p] || chant >= 0) return;
    sfx.place();
    setPicks((prev) => ({ ...prev, [p]: c }));
  };

  // Keyboard: P1 = A/S/D, P2 = J/K/L
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      for (const c of CHOICES) {
        if (k === c.keys[0]) pick(1, c.id);
        if (k === c.keys[1]) pick(2, c.id);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

  // When both have picked: chant, then reveal at the same time.
  useEffect(() => {
    if (!both || chant >= 3) return;
    const t = setTimeout(() => {
      const next = chant + 1;
      setChant(next);
      if (next < 3) sfx.tick();
      if (next === 3) {
        sfx.go();
        const a = picks[1]!, b = picks[2]!;
        const winner: PlayerId | null = a === b ? null : BEATS[a] === b ? 1 : 2;
        const label = (c: Choice) => CHOICES.find((x) => x.id === c)!.label;
        onFinish({ winner, detail: `${label(a)} vs ${label(b)}` });
      }
    }, chant === -1 ? 300 : 550);
    return () => clearTimeout(t);
  }, [both, chant, picks, onFinish]);

  const half = (p: PlayerId) => {
    const mine = picks[p];
    const revealed = chant >= 3;
    const choice = CHOICES.find((c) => c.id === mine);
    return (
      <div className={cn("flex h-full flex-col items-center justify-center gap-4 p-4", p === 1 ? "bg-p1/10" : "bg-p2/10")}>
        <div className="flex items-center gap-2">
          <span className="text-3xl">{players[p].emoji}</span>
          <span className={cn("font-display text-xl font-bold", p === 1 ? "text-p1" : "text-p2")}>{players[p].name}</span>
        </div>
        <AnimatePresence mode="wait">
          {revealed && choice ? (
            <motion.div key="reveal" initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 12 }} className="text-center">
              <div className="text-8xl">{choice.emoji}</div>
              <div className="font-display text-2xl font-bold">{choice.label}</div>
            </motion.div>
          ) : mine ? (
            <motion.div key="hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <motion.div animate={chant >= 0 ? { y: [0, -16, 0] } : {}} transition={{ repeat: Infinity, duration: 0.55 }} className="text-7xl">
                ✊
              </motion.div>
              <p className="mt-2 font-semibold">{both ? CHANT[Math.max(0, chant)] : "✅ Sudah memilih! Menunggu lawan..."}</p>
            </motion.div>
          ) : (
            <motion.div key="pick" className="grid w-full max-w-xs grid-cols-3 gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {CHOICES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => pick(p, c.id)}
                  className="flex flex-col items-center rounded-2xl bg-white py-3 shadow-md transition active:scale-90 dark:bg-white/10"
                >
                  <span className="text-4xl">{c.emoji}</span>
                  <span className="text-sm font-semibold">{c.label}</span>
                  <span className="hidden text-[10px] uppercase opacity-40 landscape:md:block">{c.keys[p - 1]}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        {!mine && <p className="text-xs opacity-60">Pilih diam-diam, jangan diintip lawan! 🤫</p>}
      </div>
    );
  };

  return <SplitScreen p1={half(1)} p2={half(2)} center={<div className="grid h-12 w-12 place-items-center rounded-full bg-white font-display font-bold text-slate-900 shadow-xl">VS</div>} />;
}
