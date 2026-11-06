"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps, PlayerId } from "../types";
import TurnBanner from "@/components/TurnBanner";
import { sfx } from "@/lib/sound";
import { cn, other } from "@/lib/utils";

/*
 * Board indexes (sowing goes 0 -> 15, counter-clockwise):
 *   0..6  = Player 1's holes (bottom row, left to right)
 *   7     = Player 1's store (right)
 *   8..14 = Player 2's holes (top row, right to left)
 *   15    = Player 2's store (left)
 */
const HOLES = 7;
const SEEDS = 7;
const STORE: Record<PlayerId, number> = { 1: 7, 2: 15 };
const STEP_MS = 110;

const own = (p: PlayerId, i: number) => (p === 1 ? i >= 0 && i <= 6 : i >= 8 && i <= 14);
const opposite = (i: number) => 14 - i;

interface Frame {
  board: number[];
  hand: number; // hole the hand is over
}

/**
 * Plays one turn of congklak with relay sowing:
 * - last seed in own store -> play again
 * - last seed in a non-empty hole -> pick all seeds up and keep sowing
 * - last seed in an empty own hole -> capture it plus the opposite hole
 * - last seed in an empty opponent hole -> turn ends
 */
function sow(start: number[], p: PlayerId, from: number): { frames: Frame[]; final: number[]; again: boolean } {
  const board = [...start];
  const frames: Frame[] = [];
  let pos = from;
  let hand = board[pos];
  board[pos] = 0;
  frames.push({ board: [...board], hand: pos });
  let guard = 0;

  while (guard++ < 5000) {
    while (hand > 0) {
      pos = (pos + 1) % 16;
      if (pos === STORE[other(p)]) continue; // skip the opponent's store
      board[pos]++;
      hand--;
      frames.push({ board: [...board], hand: pos });
    }
    if (pos === STORE[p]) return { frames, final: board, again: true };
    if (board[pos] > 1) {
      // Relay: pick up everything in this hole and continue.
      hand = board[pos];
      board[pos] = 0;
      frames.push({ board: [...board], hand: pos });
      continue;
    }
    if (own(p, pos) && board[opposite(pos)] > 0) {
      board[STORE[p]] += board[pos] + board[opposite(pos)];
      board[pos] = 0;
      board[opposite(pos)] = 0;
      frames.push({ board: [...board], hand: STORE[p] });
    }
    break;
  }
  return { frames, final: board, again: false };
}

const sideEmpty = (b: number[], p: PlayerId) => (p === 1 ? b.slice(0, 7) : b.slice(8, 15)).every((n) => n === 0);

export default function Congklak({ players, startingPlayer, onFinish }: GameProps) {
  const [board, setBoard] = useState<number[]>(() => Array.from({ length: 16 }, (_, i) => (i === 7 || i === 15 ? 0 : SEEDS)));
  const [turn, setTurn] = useState<PlayerId>(startingPlayer);
  const [hand, setHand] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [over, setOver] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  useEffect(() => () => clearInterval(timer.current), []);

  const endGame = (b: number[]) => {
    // Remaining seeds go to the owner of the side they are on.
    const final = [...b];
    for (let i = 0; i < HOLES; i++) {
      final[7] += final[i];
      final[i] = 0;
      final[15] += final[8 + i];
      final[8 + i] = 0;
    }
    setBoard(final);
    setOver(true);
    const s1 = final[7], s2 = final[15];
    onFinish({ winner: s1 === s2 ? null : s1 > s2 ? 1 : 2, detail: `${s1} – ${s2} biji` });
  };

  const pick = (i: number) => {
    if (busy || over || !own(turn, i) || board[i] === 0) return;
    sfx.tap();
    const { frames, final, again } = sow(board, turn, i);
    setBusy(true);
    setNote("");
    let f = 0;
    timer.current = setInterval(() => {
      const frame = frames[f++];
      if (frame) {
        setBoard(frame.board);
        setHand(frame.hand);
        sfx.flip();
        return;
      }
      clearInterval(timer.current);
      setHand(null);
      setBusy(false);
      setBoard(final);
      const next = again ? turn : other(turn);
      if (sideEmpty(final, 1) || sideEmpty(final, 2)) return endGame(final);
      if (again) setNote("Masuk lumbung! Main lagi");
      setTurn(next);
    }, STEP_MS);
  };

  const hole = (i: number) => {
    const n = board[i];
    const playable = !busy && !over && own(turn, i) && n > 0;
    const owner: PlayerId = i <= 6 ? 1 : 2;
    return (
      <button
        key={i}
        onClick={() => pick(i)}
        disabled={!playable}
        aria-label={`Lubang berisi ${n} biji`}
        className={cn(
          "relative grid aspect-square w-full place-items-center rounded-full shadow-inner transition",
          "bg-amber-900/25 dark:bg-black/40",
          playable && (owner === 1 ? "ring-2 ring-p1" : "ring-2 ring-p2"),
          playable && "hover:scale-105",
          hand === i && "scale-110 bg-yellow-300/60",
        )}
      >
        <Seeds n={n} />
        <span className="absolute -bottom-1 rounded-full bg-black/60 px-1.5 text-[10px] font-bold text-white">{n}</span>
      </button>
    );
  };

  const store = (p: PlayerId) => (
    <div
      className={cn(
        "flex h-full w-[11%] shrink-0 flex-col items-center justify-center rounded-full border-4 bg-amber-900/25 shadow-inner dark:bg-black/40",
        p === 1 ? "border-p1" : "border-p2",
        hand === STORE[p] && "bg-yellow-300/60",
      )}
    >
      <motion.span key={board[STORE[p]]} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="font-display text-xl font-bold sm:text-2xl">
        {board[STORE[p]]}
      </motion.span>
    </div>
  );

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-3">
      <TurnBanner players={players} turn={over ? null : turn} scores={{ 1: board[7], 2: board[15] }} />
      <div className="flex w-full max-w-2xl items-stretch gap-1.5 rounded-[2.5rem] bg-gradient-to-b from-amber-600 to-amber-800 p-2.5 shadow-2xl sm:gap-3 sm:p-4">
        {store(2)}
        <div className="flex flex-1 flex-col gap-3 py-1 sm:gap-5">
          {/* Player 2's holes, shown right to left (8 at the right) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {[14, 13, 12, 11, 10, 9, 8].map(hole)}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map(hole)}
          </div>
        </div>
        {store(1)}
      </div>
      <div className="flex w-full max-w-2xl justify-between px-2 text-xs font-semibold opacity-70">
        <span className="text-p2">↑ Lubang & lumbung {players[2].name} (kiri)</span>
        <span className="text-p1">Lumbung {players[1].name} (kanan) ↓</span>
      </div>
      <p className="h-5 text-sm font-semibold">{note || (busy ? "Membagikan biji..." : "Ketuk lubang di barismu untuk mulai membagi")}</p>
    </div>
  );
}

/** Small dots for up to 12 seeds, then just the number. */
function Seeds({ n }: { n: number }) {
  if (n === 0) return null;
  const shown = Math.min(n, 12);
  return (
    <span className="flex w-[70%] flex-wrap items-center justify-center gap-[2px]">
      {Array.from({ length: shown }, (_, k) => (
        <span key={k} className="h-[5px] w-[5px] rounded-full bg-white/90 shadow sm:h-2 sm:w-2" />
      ))}
    </span>
  );
}
