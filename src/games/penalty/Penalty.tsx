"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GameProps, PlayerId } from "../types";
import SplitScreen from "@/components/SplitScreen";
import { sfx, vibrate } from "@/lib/sound";
import { cn, other } from "@/lib/utils";

const KICKS = 5; // per player before sudden death
const ZONES = ["Kiri", "Tengah", "Kanan"];

type Kick = { kicker: PlayerId; goal: boolean };

/** Decides the shootout: returns the winner, or null if it must go on. */
function decide(kicks: Kick[]): PlayerId | null {
  const taken = { 1: 0, 2: 0 } as Record<PlayerId, number>;
  const goals = { 1: 0, 2: 0 } as Record<PlayerId, number>;
  kicks.forEach((k) => {
    taken[k.kicker]++;
    if (k.goal) goals[k.kicker]++;
  });
  if (taken[1] <= KICKS && taken[2] <= KICKS) {
    // Regular phase: stop early when one side can no longer catch up.
    for (const p of [1, 2] as PlayerId[]) {
      const o = other(p);
      if (goals[p] > goals[o] + (KICKS - taken[o])) return p;
    }
    if (taken[1] === KICKS && taken[2] === KICKS && goals[1] !== goals[2]) return goals[1] > goals[2] ? 1 : 2;
    return null;
  }
  // Sudden death: after each pair of kicks.
  if (taken[1] === taken[2] && goals[1] !== goals[2]) return goals[1] > goals[2] ? 1 : 2;
  return null;
}

export default function Penalty({ players, startingPlayer, onFinish }: GameProps) {
  const [kicks, setKicks] = useState<Kick[]>([]);
  const [shot, setShot] = useState<number | null>(null);
  const [dive, setDive] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);
  const [over, setOver] = useState(false);

  // Kickers alternate, starting with startingPlayer.
  const kicker: PlayerId = kicks.length % 2 === 0 ? startingPlayer : other(startingPlayer);
  const keeper = other(kicker);
  const goals = (p: PlayerId) => kicks.filter((k) => k.kicker === p && k.goal).length;

  // Both picked -> short pause -> reveal.
  useEffect(() => {
    if (shot === null || dive === null || reveal) return;
    const t = setTimeout(() => {
      setReveal(true);
      if (shot !== dive) {
        sfx.correct();
        vibrate(80);
      } else sfx.wrong();
    }, 400);
    return () => clearTimeout(t);
  }, [shot, dive, reveal]);

  // After the reveal animation, record the kick and check for a winner.
  useEffect(() => {
    if (!reveal || shot === null || dive === null) return;
    const t = setTimeout(() => {
      const next = [...kicks, { kicker, goal: shot !== dive }];
      setKicks(next);
      setShot(null);
      setDive(null);
      setReveal(false);
      const w = decide(next);
      if (w) {
        setOver(true);
        const g = (p: PlayerId) => next.filter((k) => k.kicker === p && k.goal).length;
        onFinish({ winner: w, detail: `Adu penalti ${g(1)} – ${g(2)}` });
      }
    }, 1700);
    return () => clearTimeout(t);
  }, [reveal, shot, dive, kicks, kicker, onFinish]);

  const half = (p: PlayerId) => {
    const isKicker = p === kicker;
    const mine = isKicker ? shot : dive;
    const myKicks = kicks.filter((k) => k.kicker === p);
    return (
      <div className={cn("flex h-full flex-col items-center justify-center gap-3 p-4", p === 1 ? "bg-p1/10" : "bg-p2/10")}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{players[p].emoji}</span>
          <span className={cn("font-display text-lg font-bold", p === 1 ? "text-p1" : "text-p2")}>{players[p].name}</span>
          <span className="chip bg-black/10 dark:bg-white/10">{isKicker ? "Penendang" : "Kiper"}</span>
        </div>
        {/* Kick record */}
        <div className="flex gap-1">
          {Array.from({ length: Math.max(KICKS, myKicks.length) }, (_, i) => (
            <span
              key={i}
              className={cn("h-3 w-3 rounded-full", myKicks[i] ? (myKicks[i].goal ? "bg-emerald-500" : "bg-red-500") : "bg-black/15 dark:bg-white/20")}
            />
          ))}
        </div>

        <Goal
          zones={ZONES}
          interactive={!over && mine === null && !reveal}
          onPick={(z) => {
            sfx.tap();
            if (isKicker) setShot(z);
            else setDive(z);
          }}
          ball={reveal ? shot : null}
          keeper={reveal ? dive : null}
          isKicker={isKicker}
        />

        <p className="h-5 text-center text-sm font-semibold">
          {reveal
            ? shot !== dive
              ? isKicker ? "GOOOL!" : "Kebobolan!"
              : isKicker ? "Ditepis kiper!" : "Tepisan hebat!"
            : mine === null
              ? isKicker ? "Pilih arah tendangan (diam-diam)" : "Tebak arah lompatan"
              : "Sudah memilih. Menunggu lawan..."}
        </p>
      </div>
    );
  };

  return (
    <SplitScreen
      p1={half(1)}
      p2={half(2)}
      center={
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 font-display font-bold text-slate-900 shadow-xl">
          <span className="text-p1">{goals(1)}</span>
          <span className="text-xs font-semibold opacity-50">{kicks.length >= KICKS * 2 ? "SUDDEN DEATH" : "PENALTI"}</span>
          <span className="text-p2">{goals(2)}</span>
        </div>
      }
    />
  );
}

function Goal({
  zones,
  interactive,
  onPick,
  ball,
  keeper,
  isKicker,
}: {
  zones: string[];
  interactive: boolean;
  onPick: (z: number) => void;
  ball: number | null;
  keeper: number | null;
  isKicker: boolean;
}) {
  return (
    <div className="relative w-full max-w-sm">
      <div className="relative grid aspect-[2.4/1] grid-cols-3 overflow-hidden rounded-t-lg border-x-[6px] border-t-[6px] border-white bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.12)_0_6px,transparent_6px_12px)] bg-emerald-700 shadow-lg">
        {zones.map((z, i) => (
          <button
            key={z}
            disabled={!interactive}
            onClick={() => onPick(i)}
            className={cn(
              "relative flex items-end justify-center border-white/20 pb-1 text-xs font-bold text-white/80 transition",
              i < 2 && "border-r border-dashed",
              interactive && "hover:bg-white/15 active:bg-white/25",
            )}
          >
            {interactive && z}
          </button>
        ))}
        <AnimatePresence>
          {keeper !== null && (
            <motion.div
              key="keeper"
              style={{ x: "-50%" }}
              initial={{ left: "50%", rotate: 0 }}
              animate={{ left: `${keeper * 33.3 + 16.6}%`, rotate: keeper === 0 ? -40 : keeper === 2 ? 40 : 0 }}
              className="absolute bottom-0 h-[70%] w-[16%] rounded-t-full bg-yellow-400 shadow"
            />
          )}
          {ball !== null && (
            <motion.div
              key="ball"
              style={{ x: "-50%" }}
              initial={{ top: "110%", left: "50%", scale: 1.6 }}
              animate={{ top: "35%", left: `${ball * 33.3 + 16.6}%`, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="absolute h-5 w-5 rounded-full border-2 border-slate-800 bg-white"
            />
          )}
        </AnimatePresence>
      </div>
      <p className="mt-1 text-center text-[11px] opacity-50">{isKicker ? "Gawang lawan" : "Gawangmu"}</p>
    </div>
  );
}
