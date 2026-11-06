"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { GameProps, PlayerId } from "../types";
import TurnBanner from "@/components/TurnBanner";
import { sfx } from "@/lib/sound";
import { other } from "@/lib/utils";

const N = 4; // boxes per side -> (N+1)x(N+1) dots
const GAP = 60; // SVG units between dots
const PAD = 14;
const SIZE = N * GAP + PAD * 2;

// Line keys: "h-r-c" (horizontal, r in 0..N, c in 0..N-1), "v-r-c" (vertical, r in 0..N-1, c in 0..N)
type Lines = Record<string, PlayerId>;

function boxDone(lines: Lines, r: number, c: number) {
  return !!(lines[`h-${r}-${c}`] && lines[`h-${r + 1}-${c}`] && lines[`v-${r}-${c}`] && lines[`v-${r}-${c + 1}`]);
}

/** Boxes that touch a given line. */
function neighbors(key: string): [number, number][] {
  const [t, rs, cs] = key.split("-");
  const r = +rs, c = +cs;
  const out: [number, number][] = t === "h" ? [[r - 1, c], [r, c]] : [[r, c - 1], [r, c]];
  return out.filter(([a, b]) => a >= 0 && a < N && b >= 0 && b < N);
}

export default function DotsAndBoxes({ players, startingPlayer, onFinish }: GameProps) {
  const [lines, setLines] = useState<Lines>({});
  const [boxes, setBoxes] = useState<Record<string, PlayerId>>({});
  const [turn, setTurn] = useState<PlayerId>(startingPlayer);
  const scores = { 1: 0, 2: 0 } as Record<PlayerId, number>;
  Object.values(boxes).forEach((p) => scores[p]++);
  const done = Object.keys(boxes).length === N * N;

  const draw = (key: string) => {
    if (lines[key] || done) return;
    const nextLines = { ...lines, [key]: turn };
    const nextBoxes = { ...boxes };
    let claimed = 0;
    for (const [r, c] of neighbors(key)) {
      if (boxDone(nextLines, r, c)) {
        nextBoxes[`${r}-${c}`] = turn;
        claimed++;
      }
    }
    setLines(nextLines);
    setBoxes(nextBoxes);
    if (claimed) sfx.correct();
    else sfx.place();

    if (Object.keys(nextBoxes).length === N * N) {
      const s = { 1: 0, 2: 0 };
      Object.values(nextBoxes).forEach((p) => s[p]++);
      onFinish({ winner: s[1] === s[2] ? null : s[1] > s[2] ? 1 : 2, detail: `${s[1]} – ${s[2]} kotak` });
    } else if (!claimed) {
      setTurn(other(turn)); // completing a box earns another move
    }
  };

  const lineEls: React.ReactNode[] = [];
  for (let r = 0; r <= N; r++)
    for (let c = 0; c < N; c++) lineEls.push(<Line key={`h-${r}-${c}`} k={`h-${r}-${c}`} x1={c} y1={r} x2={c + 1} y2={r} owner={lines[`h-${r}-${c}`]} onDraw={draw} />);
  for (let r = 0; r < N; r++)
    for (let c = 0; c <= N; c++) lineEls.push(<Line key={`v-${r}-${c}`} k={`v-${r}-${c}`} x1={c} y1={r} x2={c} y2={r + 1} owner={lines[`v-${r}-${c}`]} onDraw={draw} />);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-3">
      <TurnBanner players={players} turn={done ? null : turn} scores={scores} />
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[min(92vw,460px)] touch-manipulation select-none">
        {Object.entries(boxes).map(([k, p]) => {
          const [r, c] = k.split("-").map(Number);
          return (
            <motion.g key={k} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ originX: `${PAD + c * GAP + GAP / 2}px`, originY: `${PAD + r * GAP + GAP / 2}px` }}>
              <rect x={PAD + c * GAP + 4} y={PAD + r * GAP + 4} width={GAP - 8} height={GAP - 8} rx={8} fill={`rgb(var(--p${p}) / 0.25)`} />
              <text x={PAD + c * GAP + GAP / 2} y={PAD + r * GAP + GAP / 2 + 9} textAnchor="middle" fontSize={26}>
                {players[p].emoji}
              </text>
            </motion.g>
          );
        })}
        {lineEls}
        {Array.from({ length: (N + 1) ** 2 }, (_, i) => (
          <circle key={i} cx={PAD + (i % (N + 1)) * GAP} cy={PAD + Math.floor(i / (N + 1)) * GAP} r={6} className="fill-slate-700 dark:fill-slate-200" />
        ))}
      </svg>
      <p className="text-sm opacity-60">Lengkapi kotak = dapat giliran lagi!</p>
    </div>
  );
}

function Line({ k, x1, y1, x2, y2, owner, onDraw }: { k: string; x1: number; y1: number; x2: number; y2: number; owner?: PlayerId; onDraw: (k: string) => void }) {
  const p = (v: number) => PAD + v * GAP;
  return (
    <g onClick={() => onDraw(k)} className={owner ? "" : "cursor-pointer [&:hover>line:last-child]:stroke-black/25 dark:[&:hover>line:last-child]:stroke-white/30"}>
      {/* Wide invisible hit area so lines are easy to tap on a phone */}
      <line x1={p(x1)} y1={p(y1)} x2={p(x2)} y2={p(y2)} stroke="transparent" strokeWidth={24} />
      <line
        x1={p(x1)} y1={p(y1)} x2={p(x2)} y2={p(y2)}
        strokeWidth={owner ? 7 : 5}
        strokeLinecap="round"
        stroke={owner ? `rgb(var(--p${owner}))` : "rgb(128 128 128 / 0.15)"}
        style={{ transition: "stroke 0.2s" }}
      />
    </g>
  );
}
