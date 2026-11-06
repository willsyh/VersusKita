"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { GameProps, PlayerId } from "../types";
import TurnBanner from "@/components/TurnBanner";
import { sfx } from "@/lib/sound";
import { cn, other } from "@/lib/utils";

const N = 13;
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

function fiveFrom(b: (PlayerId | null)[], i: number): number[] | null {
  const p = b[i];
  const r = Math.floor(i / N), c = i % N;
  for (const [dr, dc] of DIRS) {
    const line = [i];
    for (const s of [1, -1]) {
      let rr = r + dr * s, cc = c + dc * s;
      while (rr >= 0 && rr < N && cc >= 0 && cc < N && b[rr * N + cc] === p) {
        line.push(rr * N + cc);
        rr += dr * s;
        cc += dc * s;
      }
    }
    if (line.length >= 5) return line;
  }
  return null;
}

export default function Gomoku({ players, startingPlayer, onFinish }: GameProps) {
  const [board, setBoard] = useState<(PlayerId | null)[]>(() => Array(N * N).fill(null));
  const [turn, setTurn] = useState<PlayerId>(startingPlayer);
  const [last, setLast] = useState<number | null>(null);
  const [win, setWin] = useState<number[] | null>(null);
  const done = !!win || board.every(Boolean);

  const place = (i: number) => {
    if (board[i] || done) return;
    sfx.place();
    const next = [...board];
    next[i] = turn;
    setBoard(next);
    setLast(i);
    const line = fiveFrom(next, i);
    if (line) {
      setWin(line);
      onFinish({ winner: turn });
    } else if (next.every(Boolean)) onFinish({ winner: null });
    else setTurn(other(turn));
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-3">
      <TurnBanner players={players} turn={done ? null : turn} />
      <div className="w-full max-w-[min(94vw,62dvh,560px)] rounded-2xl bg-[#e3c48f] p-[3%] shadow-xl dark:bg-[#8a7048]">
        <div className="grid aspect-square" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
          {board.map((cell, i) => {
            const r = Math.floor(i / N), c = i % N;
            return (
              <button
                key={i}
                onClick={() => place(i)}
                aria-label={`Titik ${r + 1}-${c + 1}`}
                className="relative grid place-items-center"
              >
                {/* Grid lines meeting at the center of each cell */}
                <span className={cn("absolute top-1/2 h-px bg-black/45", c === 0 ? "left-1/2" : "left-0", c === N - 1 ? "right-1/2" : "right-0")} />
                <span className={cn("absolute left-1/2 w-px bg-black/45", r === 0 ? "top-1/2" : "top-0", r === N - 1 ? "bottom-1/2" : "bottom-0")} />
                {cell && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: win?.includes(i) ? [1, 1.2, 1] : 1 }}
                    transition={win?.includes(i) ? { repeat: Infinity, duration: 0.8 } : { type: "spring", stiffness: 500, damping: 20 }}
                    className={cn(
                      "relative z-10 h-[86%] w-[86%] rounded-full shadow-md",
                      cell === 1 ? "bg-p1" : "bg-p2",
                      last === i && !win && "ring-2 ring-white",
                      win?.includes(i) && "ring-2 ring-yellow-300",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-sm opacity-60">Susun 5 batu sejajar: mendatar, menurun, atau diagonal</p>
    </div>
  );
}
