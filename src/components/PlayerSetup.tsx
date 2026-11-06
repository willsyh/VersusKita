"use client";

import { motion } from "framer-motion";
import type { PlayerId } from "@/games/types";
import { useStore } from "@/lib/store";
import { PLAYER_COLORS, PLAYER_EMOJIS, rgb } from "@/lib/colors";
import { cn } from "@/lib/utils";

export default function PlayerSetup() {
  return (
    <div className="relative grid gap-3 sm:grid-cols-2 sm:gap-4">
      <PlayerCard id={1} />
      <PlayerCard id={2} />
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-p1 to-p2 font-display text-lg font-bold text-white shadow-xl ring-4 ring-[rgb(var(--bg))]">
        VS
      </div>
    </div>
  );
}

function PlayerCard({ id }: { id: PlayerId }) {
  const player = useStore((s) => s.players[id]);
  const otherColor = useStore((s) => s.players[id === 1 ? 2 : 1].color);
  const setPlayer = useStore((s) => s.setPlayer);

  return (
    <div className="card relative overflow-hidden p-4" style={{ borderColor: rgb(player.color, 0.5) }}>
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: rgb(player.color) }} />
      <div className="flex items-center gap-3">
        <motion.div
          key={player.emoji}
          initial={{ scale: 0.5, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl"
          style={{ background: rgb(player.color, 0.18) }}
        >
          {player.emoji}
        </motion.div>
        <div className="min-w-0 flex-1">
          <label htmlFor={`name-${id}`} className="text-xs font-semibold uppercase tracking-wider" style={{ color: rgb(player.color) }}>
            Pemain {id}
          </label>
          <input
            id={`name-${id}`}
            value={player.name}
            maxLength={14}
            placeholder={`Nama Pemain ${id}`}
            onChange={(e) => setPlayer(id, { name: e.target.value })}
            className="w-full bg-transparent font-display text-xl font-semibold outline-none placeholder:opacity-40"
          />
        </div>
      </div>

      <div className="mt-3 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
        {PLAYER_EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => setPlayer(id, { emoji: e })}
            aria-label={`Avatar ${e}`}
            className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xl transition", player.emoji === e ? "scale-110" : "opacity-60 hover:opacity-100")}
            style={player.emoji === e ? { background: rgb(player.color, 0.2) } : undefined}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-2">
        {PLAYER_COLORS.map((c) => {
          const taken = c.rgb === otherColor;
          const active = c.rgb === player.color;
          return (
            <button
              key={c.id}
              disabled={taken}
              onClick={() => setPlayer(id, { color: c.rgb })}
              aria-label={`Warna ${c.label}${taken ? " (dipakai lawan)" : ""}`}
              className={cn("h-7 w-7 rounded-full transition disabled:cursor-not-allowed disabled:opacity-20", active && "ring-2 ring-offset-2 ring-offset-[rgb(var(--bg))]")}
              style={{ background: rgb(c.rgb), ["--tw-ring-color" as string]: rgb(c.rgb) }}
            />
          );
        })}
      </div>
    </div>
  );
}
