"use client";

import QuickDuel, { type DuelQuestion } from "@/components/QuickDuel";
import type { GameProps } from "../types";

const COLORS = [
  { name: "MERAH", hex: "#ef4444" },
  { name: "BIRU", hex: "#3b82f6" },
  { name: "HIJAU", hex: "#22c55e" },
  { name: "KUNING", hex: "#eab308" },
  { name: "UNGU", hex: "#a855f7" },
  { name: "ORANYE", hex: "#f97316" },
];

const pick = () => COLORS[Math.floor(Math.random() * COLORS.length)];

// Stroop test: the word says one color, the ink may be another.
function generate(): DuelQuestion {
  const word = pick();
  const truth = Math.random() < 0.5;
  let ink = word;
  if (!truth) while (ink === word) ink = pick();
  return {
    truth,
    prompt: (
      <span className="font-display text-5xl font-bold tracking-wide sm:text-6xl" style={{ color: ink.hex }}>
        {word.name}
      </span>
    ),
  };
}

export default function ColorMatch({ players, onFinish }: GameProps) {
  return <QuickDuel players={players} onFinish={onFinish} generate={generate} instruction="Warna tulisan sama dengan katanya?" />;
}
