"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { GameProps, PlayerId } from "../types";
import TurnBanner from "@/components/TurnBanner";
import { sfx } from "@/lib/sound";
import { cn, other } from "@/lib/utils";

type Cell = PlayerId | null;

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function findWin(board: Cell[]) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return line;
  }
  return null;
}

export default function TicTacToe({ players, startingPlayer, onFinish }: GameProps) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<PlayerId>(startingPlayer);
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const done = winLine !== null || board.every(Boolean);

  const play = (i: number) => {
    if (board[i] || done) return;
    sfx.place();
    const next = [...board];
    next[i] = turn;
    setBoard(next);
    const line = findWin(next);
    if (line) {
      setWinLine(line);
      onFinish({ winner: turn });
    } else if (next.every(Boolean)) {
      onFinish({ winner: null });
    } else {
      setTurn(other(turn));
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-4">
      <TurnBanner players={players} turn={done ? null : turn} />
      <div className="grid aspect-square w-full max-w-[min(90vw,420px)] grid-cols-3 gap-2 rounded-3xl bg-black/5 p-2 dark:bg-white/5">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => play(i)}
            aria-label={`Kotak ${i + 1}`}
            className={cn(
              "grid place-items-center rounded-2xl bg-white text-5xl font-bold shadow-sm transition dark:bg-white/10 sm:text-6xl",
              !cell && !done && "hover:scale-[0.97]",
              winLine?.includes(i) && (cell === 1 ? "bg-p1/20 dark:bg-p1/30" : "bg-p2/20 dark:bg-p2/30"),
            )}
          >
            {cell && (
              <motion.span
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: winLine?.includes(i) ? [1, 1.25, 1] : 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className={cell === 1 ? "text-p1" : "text-p2"}
              >
                {cell === 1 ? "✕" : "◯"}
              </motion.span>
            )}
          </button>
        ))}
      </div>
      <p className="text-sm opacity-60">
        {players[1].emoji} = <span className="font-bold text-p1">✕</span> · {players[2].emoji} = <span className="font-bold text-p2">◯</span>
      </p>
    </div>
  );
}
