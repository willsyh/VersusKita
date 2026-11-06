"use client";

import QuickDuel, { type DuelQuestion } from "@/components/QuickDuel";
import type { GameProps } from "../types";

const rnd = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

function generate(): DuelQuestion {
  const op = ["+", "−", "×"][rnd(0, 2)];
  let a: number, b: number, answer: number;
  if (op === "+") {
    a = rnd(5, 60);
    b = rnd(5, 40);
    answer = a + b;
  } else if (op === "−") {
    a = rnd(20, 90);
    b = rnd(3, a - 1);
    answer = a - b;
  } else {
    a = rnd(2, 12);
    b = rnd(2, 12);
    answer = a * b;
  }
  const truth = Math.random() < 0.5;
  // Wrong answers are close to the right one so they are tricky.
  let shown = answer;
  if (!truth) {
    const offsets = op === "×" ? [-a, a, -b, b, -1, 1, 10, -10] : [-1, 1, -2, 2, 10, -10];
    do shown = answer + offsets[rnd(0, offsets.length - 1)];
    while (shown === answer || shown < 0);
  }
  return {
    truth,
    prompt: (
      <span className="font-display text-5xl font-bold tabular-nums sm:text-6xl">
        {a} {op} {b} = {shown}
      </span>
    ),
  };
}

export default function MathDuel({ players, onFinish }: GameProps) {
  return <QuickDuel players={players} onFinish={onFinish} generate={generate} instruction="Hasilnya benar atau salah?" />;
}
