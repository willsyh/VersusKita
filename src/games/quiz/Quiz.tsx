"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps, PlayerId } from "../types";
import SplitScreen from "@/components/SplitScreen";
import { sfx } from "@/lib/sound";
import { cn, shuffle } from "@/lib/utils";
import { QUESTIONS } from "./questions";

const ROUND_SIZE = 7;
const TIME_PER_Q = 15_000;

type Answer = { choice: number; correct: boolean };

export default function Quiz({ players, onFinish }: GameProps) {
  const questions = useMemo(() => shuffle(QUESTIONS).slice(0, ROUND_SIZE), []);
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<Record<PlayerId, number>>({ 1: 0, 2: 0 });
  const [answers, setAnswers] = useState<Record<PlayerId, Answer | null>>({ 1: null, 2: null });
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const scoresRef = useRef(scores);
  const q = questions[index];

  // Per-question timer
  useEffect(() => {
    if (revealed) return;
    const start = performance.now();
    const id = setInterval(() => {
      const left = Math.max(0, TIME_PER_Q - (performance.now() - start));
      setTimeLeft(left);
      if (left === 0) setRevealed(true);
    }, 100);
    return () => clearInterval(id);
  }, [index, revealed]);

  // After reveal, go to the next question or finish.
  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(() => {
      if (index + 1 >= questions.length) {
        const s = scoresRef.current;
        onFinish({ winner: s[1] === s[2] ? null : s[1] > s[2] ? 1 : 2, detail: `Skor kuis ${s[1]} – ${s[2]}` });
      } else {
        setIndex(index + 1);
        setAnswers({ 1: null, 2: null });
        setTimeLeft(TIME_PER_Q);
        setRevealed(false);
      }
    }, 1600);
    return () => clearTimeout(t);
  }, [revealed, index, questions.length, onFinish]);

  const answer = (p: PlayerId, choice: number) => {
    if (revealed || answers[p]) return;
    const correct = choice === q.a;
    const next = { ...answers, [p]: { choice, correct } };
    setAnswers(next);
    if (correct) {
      // First correct answer takes the point.
      sfx.correct();
      scoresRef.current = { ...scoresRef.current, [p]: scoresRef.current[p] + 1 };
      setScores(scoresRef.current);
      setRevealed(true);
    } else {
      sfx.wrong();
      if (next[1] && next[2]) setRevealed(true); // both wrong
    }
  };

  const half = (p: PlayerId) => {
    const mine = answers[p];
    return (
      <div className={cn("flex h-full flex-col justify-center gap-3 p-3 sm:p-6", p === 1 ? "bg-p1/10" : "bg-p2/10")}>
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className={p === 1 ? "text-p1" : "text-p2"}>
            {players[p].emoji} {players[p].name}
          </span>
          <span className="font-display text-xl font-bold tabular-nums">{scores[p]} poin</span>
        </div>
        <p className="font-display text-lg font-semibold leading-snug sm:text-2xl">{q.q}</p>
        <div className="grid grid-cols-2 gap-2">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.a;
            const picked = mine?.choice === i;
            return (
              <button
                key={i}
                onClick={() => answer(p, i)}
                disabled={revealed || !!mine}
                className={cn(
                  "min-h-12 rounded-xl border-2 px-2 py-2 text-sm font-semibold transition active:scale-95 sm:text-base",
                  "border-black/10 bg-white dark:border-white/10 dark:bg-white/10",
                  revealed && isCorrect && "!border-emerald-500 !bg-emerald-500 text-white",
                  picked && !mine.correct && "!border-red-500 !bg-red-500/20 line-through",
                  !revealed && mine && !picked && "opacity-50",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
        <p className="h-5 text-center text-sm font-semibold">
          {mine && !mine.correct && !revealed && "❌ Salah! Tunggu lawan..."}
          {revealed && mine?.correct && "✅ Benar! +1"}
          {revealed && !mine?.correct && answers[p === 1 ? 2 : 1]?.correct && "⚡ Lawan lebih cepat!"}
          {revealed && !answers[1]?.correct && !answers[2]?.correct && `Jawaban: ${q.options[q.a]}`}
        </p>
      </div>
    );
  };

  return (
    <SplitScreen
      p1={half(1)}
      p2={half(2)}
      center={
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-display text-sm font-bold text-slate-900 shadow-xl">
          <span>
            Soal {index + 1}/{questions.length}
          </span>
          <span className="relative h-2 w-16 overflow-hidden rounded-full bg-slate-200">
            <motion.span className="absolute inset-y-0 left-0 bg-gradient-to-r from-p1 to-p2" animate={{ width: `${(timeLeft / TIME_PER_Q) * 100}%` }} transition={{ duration: 0.1 }} />
          </span>
        </div>
      }
    />
  );
}
