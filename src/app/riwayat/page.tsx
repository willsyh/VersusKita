"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Gamepad2, History, Trophy } from "lucide-react";
import { getGame } from "@/games/registry";
import { useStore, usePlayers } from "@/lib/store";
import { cn } from "@/lib/utils";

const rtf = new Intl.RelativeTimeFormat("id", { numeric: "auto" });

function timeAgo(at: number) {
  const s = Math.round((at - Date.now()) / 1000);
  if (s > -60) return "baru saja";
  const m = Math.round(s / 60);
  if (m > -60) return rtf.format(m, "minute");
  const h = Math.round(m / 60);
  if (h > -24) return rtf.format(h, "hour");
  return new Date(at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function HistoryPage() {
  const history = useStore((s) => s.history);
  const score = useStore((s) => s.score);
  const players = usePlayers();
  const total = score[1] + score[2];
  const pct = total ? (score[1] / total) * 100 : 50;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
      <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
        <History size={28} /> Riwayat Pertandingan
      </h1>

      {/* Rivalry bar */}
      <div className="card mt-4 p-4">
        <div className="flex items-center justify-between font-display text-lg font-semibold">
          <span className="text-p1">
            {players[1].emoji} {players[1].name}
          </span>
          <span className="tabular-nums">
            <span className="text-p1">{score[1]}</span> – <span className="text-p2">{score[2]}</span>
          </span>
          <span className="text-p2">
            {players[2].name} {players[2].emoji}
          </span>
        </div>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-p2">
          <motion.div className="h-full bg-p1" initial={{ width: "50%" }} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 80 }} />
        </div>
        <p className="mt-2 text-center text-sm opacity-60">
          {total === 0 ? "Belum ada pertandingan." : score[1] === score[2] ? "Imbang! Siapa yang akan unggul? 🔥" : `${score[1] > score[2] ? players[1].name : players[2].name} sedang memimpin!`}
        </p>
      </div>

      {history.length === 0 ? (
        <div className="mt-10 text-center">
          <Gamepad2 size={56} strokeWidth={1.5} className="mx-auto opacity-60" />
          <p className="mt-2 opacity-70">Riwayat masih kosong. Ayo main!</p>
          <Link href="/" className="btn-primary mt-4">
            Pilih game
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {history.map((h, i) => {
            const game = getGame(h.gameId);
            const isTourney = h.gameId === "turnamen";
            const winnerName = h.winner === 1 ? h.p1Name : h.p2Name;
            return (
              <motion.li
                key={h.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0, transition: { delay: Math.min(i, 10) * 0.03 } }}
                className={cn("card flex items-center gap-3 p-3", isTourney && "border-2 border-yellow-400/60")}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-black/5 text-2xl dark:bg-white/10">{isTourney ? <Trophy size={22} className="text-yellow-500" /> : (game?.emoji ?? <Gamepad2 size={22} />)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {isTourney ? "Juara Turnamen" : game?.name ?? h.gameId}
                    {h.tournament && !isTourney && <span className="chip ml-1.5 bg-yellow-400/20 px-1.5 py-0 text-[10px] text-yellow-700 dark:text-yellow-300">Turnamen</span>}
                  </p>
                  <p className="text-xs opacity-60">
                    {h.p1Name} vs {h.p2Name} · {timeAgo(h.at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn("font-display font-bold", h.winner === 1 ? "text-p1" : "text-p2")}>{winnerName}</p>
                  {h.score && <p className="text-xs tabular-nums opacity-60">{h.score}</p>}
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
