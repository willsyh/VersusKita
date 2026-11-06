"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChessBishop, ChessKing, ChessKnight, ChessPawn, ChessQueen, ChessRook, Flag, Handshake, RotateCw, type LucideIcon } from "lucide-react";
import type { GameProps, PlayerId } from "../types";
import TurnBanner from "@/components/TurnBanner";
import { sfx } from "@/lib/sound";
import { cn, other } from "@/lib/utils";
import { applyMove, findKing, initialState, inCheck, legalMovesFrom, outcome, type Color, type Move, type PieceType } from "./engine";

const ICON: Record<PieceType, LucideIcon> = { k: ChessKing, q: ChessQueen, r: ChessRook, b: ChessBishop, n: ChessKnight, p: ChessPawn };
const PROMOS: PieceType[] = ["q", "r", "b", "n"];

export default function Chess({ players, startingPlayer, onFinish }: GameProps) {
  // The player who starts plays white (white always moves first).
  const playerOf = (c: Color): PlayerId => (c === "w" ? startingPlayer : other(startingPlayer));
  const [state, setState] = useState(initialState);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [promo, setPromo] = useState<Move[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [over, setOver] = useState(false);

  const moves = useMemo(() => (selected ? legalMovesFrom(state, selected[0], selected[1]) : []), [state, selected]);
  const check = inCheck(state);
  const kingSq = check ? findKing(state.board, state.turn) : null;
  const turnPlayer = playerOf(state.turn);

  const finish = (winner: PlayerId | null, detail: string) => {
    setOver(true);
    onFinish({ winner, detail });
  };

  const play = (m: Move) => {
    const next = applyMove(state, m);
    setState(next);
    setSelected(null);
    setPromo(null);
    setLastMove(m);
    if (m.capture) sfx.correct();
    else sfx.place();
    const o = outcome(next);
    if (o?.type === "checkmate") finish(playerOf(o.winner), "Skakmat!");
    else if (o?.type === "stalemate") finish(null, "Remis (stalemate)");
    else if (o?.type === "insufficient") finish(null, "Remis: bidak tidak cukup untuk skakmat");
  };

  const tap = (r: number, c: number) => {
    if (over || promo) return;
    const piece = state.board[r][c];
    if (selected) {
      const options = moves.filter((m) => m.to[0] === r && m.to[1] === c);
      if (options.length > 1) return setPromo(options); // pawn promotion: let the player choose
      if (options.length === 1) return play(options[0]);
    }
    if (piece && piece.c === state.turn) {
      sfx.tap();
      setSelected([r, c]);
    } else setSelected(null);
  };

  const resign = () => {
    if (over) return;
    if (confirm(`${players[turnPlayer].name} yakin menyerah?`)) finish(other(turnPlayer), `${players[turnPlayer].name} menyerah`);
  };
  const offerDraw = () => {
    if (over) return;
    const opp = players[other(turnPlayer)].name;
    if (confirm(`${players[turnPlayer].name} menawarkan seri. ${opp}, setuju?`)) finish(null, "Seri atas kesepakatan");
  };

  const rows = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-3">
      <TurnBanner players={players} turn={over ? null : turnPlayer} label={check ? "Skak!" : "Giliran"} />
      <div className="relative w-full max-w-[min(94vw,62dvh,560px)]">
        <div className="grid aspect-square grid-cols-8 overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/10">
          {rows.map((r) =>
            rows.map((_, ci) => {
              const c = flipped ? 7 - ci : ci;
              const piece = state.board[r][c];
              const dark = (r + c) % 2 === 1;
              const isSel = selected?.[0] === r && selected?.[1] === c;
              const target = moves.find((m) => m.to[0] === r && m.to[1] === c);
              const isLast = lastMove && ((lastMove.from[0] === r && lastMove.from[1] === c) || (lastMove.to[0] === r && lastMove.to[1] === c));
              const isCheck = kingSq && kingSq[0] === r && kingSq[1] === c;
              const Icon = piece ? ICON[piece.t] : null;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => tap(r, c)}
                  aria-label={`${"abcdefgh"[c]}${8 - r}`}
                  className={cn(
                    "relative grid place-items-center",
                    dark ? "bg-[#b9a6d9] dark:bg-[#4b3f72]" : "bg-[#f1ecfa] dark:bg-[#7d70a8]",
                    isLast && "after:absolute after:inset-0 after:bg-yellow-300/40",
                    isSel && "after:absolute after:inset-0 after:bg-yellow-300/70",
                    isCheck && "bg-red-500/80 dark:bg-red-500/80",
                  )}
                >
                  {Icon && piece && (
                    <motion.span layout className="relative z-10">
                      <Icon
                        className="h-[min(9vw,5.5dvh,56px)] w-[min(9vw,5.5dvh,56px)] drop-shadow"
                        fill={`rgb(var(--p${playerOf(piece.c)}))`}
                        stroke={piece.c === "w" ? "#ffffff" : "#1e1b2e"}
                        strokeWidth={1.6}
                      />
                    </motion.span>
                  )}
                  {target && (
                    <span
                      className={cn(
                        "absolute z-20 rounded-full",
                        target.capture ? "inset-1 border-4 border-black/30 dark:border-white/50" : "h-1/4 w-1/4 bg-black/25 dark:bg-white/50",
                      )}
                    />
                  )}
                </button>
              );
            }),
          )}
        </div>

        {promo && (
          <div className="absolute inset-0 z-30 grid place-items-center rounded-2xl bg-black/50 backdrop-blur-sm">
            <div className="card p-4 text-center">
              <p className="mb-3 font-display font-semibold">Promosi pion jadi:</p>
              <div className="flex gap-2">
                {PROMOS.map((t) => {
                  const Icon = ICON[t];
                  const m = promo.find((x) => x.promo === t)!;
                  return (
                    <button key={t} onClick={() => play(m)} className="grid h-14 w-14 place-items-center rounded-xl bg-black/5 dark:bg-white/10">
                      <Icon className="h-9 w-9" fill={`rgb(var(--p${turnPlayer}))`} stroke={state.turn === "w" ? "#fff" : "#1e1b2e"} strokeWidth={1.6} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFlipped((f) => !f)} className="btn-ghost px-3 py-2 text-sm">
          <RotateCw size={16} /> Putar papan
        </button>
        <button onClick={offerDraw} disabled={over} className="btn-ghost px-3 py-2 text-sm">
          <Handshake size={16} /> Seri
        </button>
        <button onClick={resign} disabled={over} className="btn-ghost px-3 py-2 text-sm">
          <Flag size={16} /> Menyerah
        </button>
      </div>
    </div>
  );
}
