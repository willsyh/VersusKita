"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CircleHelp, Clock, Dices, House, Play, RotateCcw, Trophy, Users } from "lucide-react";
import { CATEGORY_ICON } from "./icons";
import type { GameDefinition, GameResult, PlayerId } from "@/games/types";
import { CATEGORIES, MODE_LABEL } from "@/games/types";
import { useStore, usePlayers } from "@/lib/store";
import { sfx, vibrate } from "@/lib/sound";
import { celebrate } from "@/lib/confetti";
import { randomPunishment } from "@/lib/punishments";
import { cn, other } from "@/lib/utils";
import { HEADER_H } from "./Header";

type Phase = "intro" | "play" | "round" | "match";
type BestOf = 1 | 3 | 5;

interface Props {
  game: GameDefinition;
  /** Tournament mode: best-of is fixed and the win screen shows "Lanjut". */
  tournament?: { label: string; onContinue: (winner: PlayerId) => void };
}

const TOOLBAR_H = 44;

/**
 * Wraps any game: how-to screen, best-of series, round results, win screen.
 * Games only need to call onFinish({ winner }) once per round.
 */
export default function GameShell({ game, tournament }: Props) {
  const players = usePlayers();
  const recordWin = useStore((s) => s.recordWin);
  const punishmentOn = useStore((s) => s.settings.punishment);

  const [phase, setPhase] = useState<Phase>("intro");
  const [bestOf, setBestOf] = useState<BestOf>(tournament ? 1 : 3);
  const [wins, setWins] = useState<Record<PlayerId, number>>({ 1: 0, 2: 0 });
  const [roundNo, setRoundNo] = useState(0); // increments every round (draws too) -> remounts the game
  const [matchNo, setMatchNo] = useState(0);
  const [last, setLast] = useState<GameResult | null>(null);
  const [champion, setChampion] = useState<PlayerId | null>(null);
  const [punishment, setPunishment] = useState(randomPunishment);
  const [showHelp, setShowHelp] = useState(false);
  const finishedRef = useRef(false);
  const winsRef = useRef<Record<PlayerId, number>>({ 1: 0, 2: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const needed = Math.ceil(bestOf / 2);
  const startingPlayer: PlayerId = (roundNo + matchNo) % 2 === 1 ? 1 : 2; // matchNo starts at 1

  const startMatch = () => {
    clearTimeout(timer.current);
    winsRef.current = { 1: 0, 2: 0 };
    setWins({ 1: 0, 2: 0 });
    setRoundNo(0);
    setMatchNo((m) => m + 1);
    setChampion(null);
    setLast(null);
    finishedRef.current = false;
    setPhase("play");
  };

  const nextRound = () => {
    finishedRef.current = false;
    setRoundNo((r) => r + 1);
    setPhase("play");
  };

  const onFinish = useCallback(
    (result: GameResult) => {
      if (finishedRef.current) return; // guard against double calls
      finishedRef.current = true;
      setLast(result);

      // Let players see the final board for a moment before the overlay.
      timer.current = setTimeout(() => {
        if (result.winner === null) {
          setPhase("round");
          return;
        }
        const w = result.winner;
        const next = { ...winsRef.current, [w]: winsRef.current[w] + 1 };
        winsRef.current = next;
        setWins(next);
        if (next[w] >= needed) {
          setChampion(w);
          setPunishment(randomPunishment());
          recordWin({ gameId: game.id, winner: w, score: bestOf > 1 ? `${next[1]}-${next[2]}` : undefined, tournament: !!tournament });
          sfx.win();
          vibrate([80, 60, 80, 60, 200]);
          celebrate(useStore.getState().players[w].color);
          setPhase("match");
        } else {
          sfx.correct();
          vibrate(60);
          setPhase("round");
        }
      }, 900);
    },
    [needed, bestOf, game.id, recordWin, tournament],
  );

  const Game = game.component;
  const category = CATEGORIES.find((c) => c.id === game.category)!;
  const CategoryIcon = CATEGORY_ICON[game.category];

  return (
    <div className="flex flex-col" style={{ height: `calc(100dvh - ${HEADER_H}px)` }}>
      {/* Toolbar */}
      <div style={{ height: TOOLBAR_H }} className="flex shrink-0 items-center gap-2 border-b border-black/5 px-3 text-sm dark:border-white/10">
        {tournament ? (
          <span className="chip bg-yellow-400/20 text-yellow-700 dark:text-yellow-300">
            <Trophy size={14} /> {tournament.label}
          </span>
        ) : (
          <Link href="/" className="flex items-center gap-1 rounded-xl px-2 py-1 font-semibold hover:bg-black/5 dark:hover:bg-white/10">
            <ArrowLeft size={16} /> Menu
          </Link>
        )}
        <span className="truncate font-display font-semibold">
          {game.emoji} {game.name}
        </span>
        {phase !== "intro" && bestOf > 1 && (
          <span className="ml-auto flex items-center gap-1 font-display font-bold tabular-nums">
            <span className="text-p1">{wins[1]}</span>
            <span className="text-xs font-normal opacity-50">BO{bestOf}</span>
            <span className="text-p2">{wins[2]}</span>
          </span>
        )}
        <button
          onClick={() => setShowHelp(true)}
          className={cn("grid h-8 w-8 place-items-center rounded-xl bg-black/5 font-bold dark:bg-white/10", !(phase !== "intro" && bestOf > 1) && "ml-auto")}
          aria-label="Cara bermain"
        >
          <CircleHelp size={18} />
        </button>
      </div>

      {/* Game area */}
      <div className="relative min-h-0 flex-1">
        {phase !== "intro" && <Game key={`${matchNo}-${roundNo}`} players={players} startingPlayer={startingPlayer} onFinish={onFinish} />}

        <AnimatePresence>
          {phase === "intro" && (
            <Overlay key="intro">
              <div className="text-6xl">{game.emoji}</div>
              <h1 className="mt-2 font-display text-3xl font-bold">{game.name}</h1>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                <span className="chip bg-black/5 dark:bg-white/10">
                  <CategoryIcon size={13} /> {category.label}
                </span>
                <span className="chip bg-black/5 dark:bg-white/10">
                  <Clock size={13} /> {game.duration}
                </span>
                <span className="chip bg-black/5 dark:bg-white/10">
                  <Users size={13} /> {MODE_LABEL[game.mode]}
                </span>
              </div>
              <HowTo steps={game.howTo} />
              {!tournament && (
                <div className="mt-5 w-full">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-60">Format pertandingan</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([1, 3, 5] as BestOf[]).map((n) => (
                      <button
                        key={n}
                        onClick={() => setBestOf(n)}
                        className={cn(
                          "rounded-2xl border-2 py-2 font-display font-semibold transition",
                          bestOf === n ? "border-transparent bg-gradient-to-r from-p1 to-p2 text-white" : "border-black/10 dark:border-white/15",
                        )}
                      >
                        {n === 1 ? "Sekali" : `Best of ${n}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={startMatch} className="btn-primary mt-6 w-full py-4 text-lg">
                <Play size={20} fill="currentColor" /> Mulai
              </button>
            </Overlay>
          )}

          {phase === "round" && last && (
            <Overlay key={`round-${roundNo}`}>
              {last.winner ? (
                <>
                  <div className="text-6xl">{players[last.winner].emoji}</div>
                  <h2 className={cn("mt-2 font-display text-3xl font-bold", last.winner === 1 ? "text-p1" : "text-p2")}>
                    Ronde untuk {players[last.winner].name}!
                  </h2>
                </>
              ) : (
                <>
                  <div className="text-6xl">🤝</div>
                  <h2 className="mt-2 font-display text-3xl font-bold">Seri!</h2>
                  <p className="mt-1 opacity-70">Ronde ini diulang.</p>
                </>
              )}
              {last.detail && <p className="mt-2 font-semibold opacity-80">{last.detail}</p>}
              {bestOf > 1 && <SeriesScore wins={wins} names={[players[1].name, players[2].name]} />}
              <button onClick={nextRound} className="btn-primary mt-6 w-full py-4 text-lg">
                {last.winner ? (
                  <>
                    Ronde berikutnya <ArrowRight size={20} />
                  </>
                ) : (
                  <>
                    <RotateCcw size={20} /> Ulangi
                  </>
                )}
              </button>
            </Overlay>
          )}

          {phase === "match" && champion && (
            <Overlay key="match">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.1 }}
                className="relative grid h-28 w-28 place-items-center rounded-full text-6xl shadow-2xl"
                style={{ background: `rgb(${players[champion].color})` }}
              >
                {players[champion].emoji}
                <span className="absolute -top-5 text-4xl">👑</span>
              </motion.div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] opacity-60">Pemenang</p>
              <h2 className={cn("font-display text-4xl font-bold", champion === 1 ? "text-p1" : "text-p2")}>{players[champion].name}</h2>
              <p className="font-display text-xl font-semibold">MENANG! 🎉</p>
              {last?.detail && <p className="mt-1 text-sm opacity-70">{last.detail}</p>}
              {bestOf > 1 && <SeriesScore wins={wins} names={[players[1].name, players[2].name]} />}

              {punishmentOn && (
                <div className="mt-4 w-full rounded-2xl border-2 border-dashed border-black/15 p-3 dark:border-white/20">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Hukuman untuk {players[other(champion)].name}</p>
                  <p className="mt-1 font-semibold">{punishment}</p>
                  <button onClick={() => setPunishment(randomPunishment())} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold opacity-70 hover:opacity-100">
                    <Dices size={14} /> Acak lagi
                  </button>
                </div>
              )}

              {tournament ? (
                <button onClick={() => tournament.onContinue(champion)} className="btn-primary mt-6 w-full py-4 text-lg">
                  Lanjut <ArrowRight size={20} />
                </button>
              ) : (
                <div className="mt-6 grid w-full grid-cols-2 gap-2">
                  <Link href="/" className="btn-ghost">
                    <House size={18} /> Menu
                  </Link>
                  <button onClick={startMatch} className="btn-primary">
                    <RotateCcw size={18} /> Rematch
                  </button>
                </div>
              )}
            </Overlay>
          )}

          {showHelp && (
            <Overlay key="help" onBackdrop={() => setShowHelp(false)}>
              <h2 className="font-display text-2xl font-bold">Cara bermain</h2>
              <HowTo steps={game.howTo} />
              <button onClick={() => setShowHelp(false)} className="btn-primary mt-6 w-full">
                <Check size={18} /> Oke, paham
              </button>
            </Overlay>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Overlay({ children, onBackdrop }: { children: React.ReactNode; onBackdrop?: () => void }) {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[rgb(var(--bg)/0.7)] p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onBackdrop?.()}
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 26 }}
        className="card my-auto flex w-full max-w-sm flex-col items-center p-6 text-center"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function HowTo({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-4 w-full space-y-2 text-left text-sm">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-2 rounded-xl bg-black/[0.03] p-2.5 dark:bg-white/5">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-p1 to-p2 text-[11px] font-bold text-white">{i + 1}</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}

function SeriesScore({ wins, names }: { wins: Record<PlayerId, number>; names: [string, string] }) {
  return (
    <div className="mt-3 flex items-center gap-3 font-display text-lg font-semibold">
      <span className="text-p1">{names[0]}</span>
      <span className="tabular-nums">
        <span className="text-p1">{wins[1]}</span> – <span className="text-p2">{wins[2]}</span>
      </span>
      <span className="text-p2">{names[1]}</span>
    </div>
  );
}
