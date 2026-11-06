"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Dices, House, Play, RotateCcw, Trophy } from "lucide-react";
import GameShell from "@/components/GameShell";
import { GAMES } from "@/games/registry";
import type { PlayerId } from "@/games/types";
import { useStore, usePlayers } from "@/lib/store";
import { celebrate } from "@/lib/confetti";
import { sfx, vibrate } from "@/lib/sound";
import { cn, shuffle } from "@/lib/utils";

const TOTAL = 5;
const pickGames = () => shuffle(GAMES.filter((g) => !g.skipInTournament)).slice(0, TOTAL);

export default function TournamentPage() {
  const players = usePlayers();
  const recordWin = useStore((s) => s.recordWin);
  const [games, setGames] = useState(pickGames);
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [results, setResults] = useState<PlayerId[]>([]);

  const wins = { 1: results.filter((r) => r === 1).length, 2: results.filter((r) => r === 2).length };
  const champion: PlayerId = wins[1] > wins[2] ? 1 : 2;

  const onContinue = (winner: PlayerId) => {
    const next = [...results, winner];
    setResults(next);
    if (next.length >= TOTAL) {
      const w1 = next.filter((r) => r === 1).length;
      const champ: PlayerId = w1 > TOTAL - w1 ? 1 : 2;
      // Each game already counted in the global score; this entry is just for history.
      recordWin({ gameId: "turnamen", winner: champ, score: `${w1}-${TOTAL - w1}`, tournament: true }, false);
      setPhase("done");
      sfx.win();
      vibrate([100, 50, 100, 50, 300]);
      celebrate(useStore.getState().players[champ].color);
      setTimeout(() => celebrate(useStore.getState().players[champ].color), 1200);
    }
  };

  const restart = () => {
    setGames(pickGames());
    setResults([]);
    setPhase("intro");
  };

  if (phase === "play") {
    const i = results.length;
    return (
      <GameShell
        key={i}
        game={games[i]}
        tournament={{ label: `Game ${i + 1}/${TOTAL} · ${wins[1]}-${wins[2]}`, onContinue }}
      />
    );
  }

  return (
    <main className="bg-versus min-h-[calc(100dvh-56px)]">
      <div className="mx-auto max-w-lg px-4 pb-16 pt-8 text-center">
        {phase === "intro" ? (
          <>
            <Trophy size={64} strokeWidth={1.5} className="mx-auto text-yellow-500" />
            <h1 className="mt-2 font-display text-4xl font-bold">Turnamen Acak</h1>
            <p className="mt-2 opacity-70">5 game dipilih acak. Pemenang terbanyak dinobatkan jadi juara!</p>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="relative mx-auto grid h-32 w-32 place-items-center rounded-full text-7xl shadow-2xl"
              style={{ background: `rgb(${players[champion].color})` }}
            >
              {players[champion].emoji}
              <span className="absolute -top-7 text-5xl">👑</span>
            </motion.div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.25em] opacity-60">Juara Turnamen</p>
            <h1 className={cn("font-display text-5xl font-bold", champion === 1 ? "text-p1" : "text-p2")}>{players[champion].name}</h1>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
              <span className="text-p1">{wins[1]}</span> – <span className="text-p2">{wins[2]}</span>
            </p>
          </>
        )}

        <ol className="mt-6 space-y-2 text-left">
          {games.map((g, i) => {
            const r = results[i];
            return (
              <motion.li
                key={g.id + i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.07 } }}
                className="card flex items-center gap-3 p-3"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-black/5 font-display font-bold dark:bg-white/10">{i + 1}</span>
                <span className="text-2xl">{g.emoji}</span>
                <span className="flex-1 font-semibold">{g.name}</span>
                {r && <span className={cn("font-display font-bold", r === 1 ? "text-p1" : "text-p2")}>{players[r].emoji} {players[r].name}</span>}
              </motion.li>
            );
          })}
        </ol>

        {phase === "intro" ? (
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button onClick={() => setGames(pickGames())} className="btn-ghost">
              <Dices size={18} /> Acak ulang
            </button>
            <button onClick={() => setPhase("play")} className="btn-primary">
              <Play size={18} fill="currentColor" /> Mulai turnamen
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link href="/" className="btn-ghost">
              <House size={18} /> Menu
            </Link>
            <button onClick={restart} className="btn-primary">
              <RotateCcw size={18} /> Turnamen baru
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
