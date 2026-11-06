"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { GameProps, PlayerId } from "../types";
import TurnBanner from "@/components/TurnBanner";
import { sfx } from "@/lib/sound";
import { cn, other } from "@/lib/utils";

const COLS = 7;
const ROWS = 6;
type Cell = PlayerId | null;

/** Returns the 4 winning cell indexes (row*COLS+col) if the last move won. */
function winningCells(b: Cell[][], r: number, c: number): number[] | null {
  const p = b[r][c];
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (const [dr, dc] of dirs) {
    const cells = [[r, c]];
    for (const s of [1, -1]) {
      let rr = r + dr * s, cc = c + dc * s;
      while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && b[rr][cc] === p) {
        cells.push([rr, cc]);
        rr += dr * s;
        cc += dc * s;
      }
    }
    if (cells.length >= 4) return cells.map(([a, d]) => a * COLS + d);
  }
  return null;
}

export default function ConnectFour({ players, startingPlayer, onFinish }: GameProps) {
  const [board, setBoard] = useState<Cell[][]>(() => Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
  const [turn, setTurn] = useState<PlayerId>(startingPlayer);
  const [win, setWin] = useState<number[] | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const full = board[0].every(Boolean);
  const done = !!win || full;

  const drop = (c: number) => {
    if (done) return;
    let r = ROWS - 1;
    while (r >= 0 && board[r][c]) r--;
    if (r < 0) return;
    sfx.place();
    const next = board.map((row) => [...row]);
    next[r][c] = turn;
    setBoard(next);
    const cells = winningCells(next, r, c);
    if (cells) {
      setWin(cells);
      onFinish({ winner: turn });
    } else if (next[0].every(Boolean)) {
      onFinish({ winner: null });
    } else {
      setTurn(other(turn));
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-3">
      <TurnBanner players={players} turn={done ? null : turn} />
      <div className="w-full max-w-[min(94vw,520px)]">
        {/* Drop indicator */}
        <div className="mb-1 grid grid-cols-7 px-2">
          {Array.from({ length: COLS }, (_, c) => (
            <div key={c} className="grid h-6 place-items-center">
              {hover === c && !done && <motion.div layoutId="c4-hover" className={cn("h-4 w-4 rounded-full", turn === 1 ? "bg-p1" : "bg-p2")} />}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 rounded-3xl bg-indigo-600 p-2 shadow-xl dark:bg-indigo-900 sm:gap-2" onPointerLeave={() => setHover(null)}>
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => drop(c)}
                onPointerEnter={() => setHover(c)}
                aria-label={`Kolom ${c + 1}`}
                className="relative aspect-square rounded-full bg-[rgb(var(--bg))]"
              >
                {cell && (
                  <motion.span
                    initial={{ y: `-${(r + 1) * 115}%` }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={cn(
                      "absolute inset-0.5 rounded-full shadow-inner",
                      cell === 1 ? "bg-p1" : "bg-p2",
                      win?.includes(r * COLS + c) && "animate-pulse ring-4 ring-white",
                    )}
                  />
                )}
              </button>
            )),
          )}
        </div>
      </div>
      <p className="text-sm opacity-60">Ketuk kolom untuk menjatuhkan koin</p>
    </div>
  );
}
