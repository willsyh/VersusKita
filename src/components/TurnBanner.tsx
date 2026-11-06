"use client";

import { motion } from "framer-motion";
import type { Player, PlayerId } from "@/games/types";
import { cn } from "@/lib/utils";

/** Shows both players with the active one highlighted. Optional per-player score. */
export default function TurnBanner({
  players,
  turn,
  scores,
  label = "Giliran",
}: {
  players: Record<PlayerId, Player>;
  turn: PlayerId | null;
  scores?: Record<PlayerId, number>;
  label?: string;
}) {
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-2">
      {([1, 2] as PlayerId[]).map((id) => {
        const active = turn === id;
        return (
          <motion.div
            key={id}
            animate={{ scale: active ? 1.03 : 0.97, opacity: turn === null || active ? 1 : 0.5 }}
            className={cn(
              "flex items-center gap-2 rounded-2xl border-2 px-3 py-2",
              id === 1 ? "border-p1 bg-p1/10" : "border-p2 bg-p2/10",
              !active && "border-transparent",
            )}
          >
            <span className="text-2xl">{players[id].emoji}</span>
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate font-display font-semibold", id === 1 ? "text-p1" : "text-p2")}>{players[id].name}</span>
              <span className="block text-[11px] font-semibold uppercase tracking-wider opacity-60">{active ? label : " "}</span>
            </span>
            {scores && <span className="font-display text-2xl font-bold tabular-nums">{scores[id]}</span>}
          </motion.div>
        );
      })}
    </div>
  );
}
