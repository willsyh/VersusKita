"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Handshake } from "lucide-react";
import type { GameProps, PlayerId } from "../types";
import TurnBanner from "@/components/TurnBanner";
import { sfx } from "@/lib/sound";
import { cn, other } from "@/lib/utils";

interface Man {
  p: PlayerId;
  king: boolean;
}
type Board = (Man | null)[][];
interface Step {
  to: [number, number];
  /** Captured piece square, if this is a jump. */
  jump?: [number, number];
}

const DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const NO_CAPTURE_DRAW = 50; // moves in a row without a capture -> draw

// Player 1 sits at the bottom and moves up; Player 2 at the top moves down.
const forward = (p: PlayerId) => (p === 1 ? -1 : 1);
const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

function initialBoard(): Board {
  return Array.from({ length: 8 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) => ((r + c) % 2 === 1 && r < 3 ? { p: 2 as PlayerId, king: false } : (r + c) % 2 === 1 && r > 4 ? { p: 1 as PlayerId, king: false } : null)),
  );
}

/** Jumps available to the piece at r,c. Men may capture backwards too. */
function jumps(b: Board, r: number, c: number): Step[] {
  const m = b[r][c];
  if (!m) return [];
  const out: Step[] = [];
  for (const [dr, dc] of DIRS) {
    const mr = r + dr, mc = c + dc, tr = r + 2 * dr, tc = c + 2 * dc;
    if (inside(tr, tc) && b[mr][mc] && b[mr][mc]!.p !== m.p && !b[tr][tc]) out.push({ to: [tr, tc], jump: [mr, mc] });
  }
  return out;
}

function slides(b: Board, r: number, c: number): Step[] {
  const m = b[r][c];
  if (!m) return [];
  return DIRS.filter(([dr]) => m.king || dr === forward(m.p))
    .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
    .filter(([tr, tc]) => inside(tr, tc) && !b[tr][tc])
    .map((to) => ({ to }));
}

function playerHasCapture(b: Board, p: PlayerId) {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (b[r][c]?.p === p && jumps(b, r, c).length) return true;
  return false;
}

function playerHasMove(b: Board, p: PlayerId) {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (b[r][c]?.p === p && (jumps(b, r, c).length || slides(b, r, c).length)) return true;
  return false;
}

export default function Checkers({ players, startingPlayer, onFinish }: GameProps) {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [turn, setTurn] = useState<PlayerId>(startingPlayer);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  // During a multi-jump the same piece must keep capturing.
  const [chain, setChain] = useState<[number, number] | null>(null);
  const [quiet, setQuiet] = useState(0);
  const [over, setOver] = useState(false);

  const mustCapture = playerHasCapture(board, turn);
  const stepsFor = (r: number, c: number) => (mustCapture ? jumps(board, r, c) : slides(board, r, c));
  const steps = selected ? stepsFor(selected[0], selected[1]) : [];
  const counts = { 1: 0, 2: 0 } as Record<PlayerId, number>;
  board.flat().forEach((m) => m && counts[m.p]++);

  const finish = (winner: PlayerId | null, detail: string) => {
    setOver(true);
    onFinish({ winner, detail });
  };

  const endTurn = (b: Board, captured: boolean) => {
    const nextQuiet = captured ? 0 : quiet + 1;
    setQuiet(nextQuiet);
    setChain(null);
    setSelected(null);
    const next = other(turn);
    if (!playerHasMove(b, next)) return finish(turn, "Lawan tidak bisa bergerak lagi");
    if (nextQuiet >= NO_CAPTURE_DRAW) return finish(null, `${NO_CAPTURE_DRAW} langkah tanpa makan bidak`);
    setTurn(next);
  };

  const move = (from: [number, number], step: Step) => {
    const b = board.map((row) => [...row]);
    const piece = { ...b[from[0]][from[1]]! };
    b[from[0]][from[1]] = null;
    if (step.jump) b[step.jump[0]][step.jump[1]] = null;
    const [tr, tc] = step.to;
    const promoted = !piece.king && tr === (piece.p === 1 ? 0 : 7);
    if (promoted) piece.king = true;
    b[tr][tc] = piece;
    setBoard(b);
    if (step.jump) sfx.correct();
    else sfx.place();

    // Keep jumping with the same piece if possible (promotion ends the turn).
    if (step.jump && !promoted && jumps(b, tr, tc).length) {
      setChain([tr, tc]);
      setSelected([tr, tc]);
      return;
    }
    endTurn(b, !!step.jump);
  };

  const tap = (r: number, c: number) => {
    if (over) return;
    if (selected) {
      const step = steps.find((s) => s.to[0] === r && s.to[1] === c);
      if (step) return move(selected, step);
    }
    if (chain) return; // must continue with the chained piece
    if (board[r][c]?.p === turn && stepsFor(r, c).length) {
      sfx.tap();
      setSelected([r, c]);
    } else setSelected(null);
  };

  const offerDraw = () => {
    if (over) return;
    if (confirm(`${players[turn].name} menawarkan seri. ${players[other(turn)].name}, setuju?`)) finish(null, "Seri atas kesepakatan");
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-3">
      <TurnBanner players={players} turn={over ? null : turn} scores={counts} label={chain ? "Makan lagi!" : mustCapture ? "Wajib makan" : "Giliran"} />
      <div className="grid aspect-square w-full max-w-[min(94vw,62dvh,560px)] grid-cols-8 overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/10">
        {board.map((row, r) =>
          row.map((m, c) => {
            const darkSq = (r + c) % 2 === 1;
            const isSel = selected?.[0] === r && selected?.[1] === c;
            const target = steps.find((s) => s.to[0] === r && s.to[1] === c);
            const movable = !over && !chain && m?.p === turn && stepsFor(r, c).length > 0;
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => tap(r, c)}
                aria-label={`Petak ${r + 1}-${c + 1}`}
                className={cn("relative grid place-items-center", darkSq ? "bg-[#8b6f4e] dark:bg-[#5b4632]" : "bg-[#efe1c6] dark:bg-[#a89276]")}
              >
                {m && (
                  <motion.span
                    initial={false}
                    animate={{ scale: isSel ? 1.1 : 1 }}
                    className={cn(
                      "grid h-[78%] w-[78%] place-items-center rounded-full border-4 shadow-md",
                      m.p === 1 ? "border-white/40 bg-p1" : "border-black/20 bg-p2",
                      isSel && "ring-4 ring-yellow-300",
                      movable && !isSel && "ring-2 ring-white/70",
                    )}
                  >
                    {m.king && <Crown className="h-1/2 w-1/2 text-yellow-200" fill="currentColor" />}
                  </motion.span>
                )}
                {target && <span className={cn("absolute rounded-full", target.jump ? "h-1/2 w-1/2 border-4 border-yellow-300" : "h-1/4 w-1/4 bg-yellow-200/80")} />}
              </button>
            );
          }),
        )}
      </div>
      <button onClick={offerDraw} disabled={over} className="btn-ghost px-3 py-2 text-sm">
        <Handshake size={16} /> Tawarkan seri
      </button>
    </div>
  );
}
