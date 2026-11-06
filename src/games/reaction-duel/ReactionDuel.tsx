"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GameProps, PlayerId } from "../types";
import SplitScreen, { useTapKeys } from "@/components/SplitScreen";
import TapZone from "@/components/TapZone";
import { sfx, vibrate } from "@/lib/sound";
import { cn, other } from "@/lib/utils";

type Phase = "ready" | "wait" | "go" | "done";

export default function ReactionDuel({ players, onFinish }: GameProps) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [result, setResult] = useState<{ winner: PlayerId; cheat?: PlayerId; ms?: number } | null>(null);
  const goAt = useRef(0);
  const phaseRef = useRef<Phase>("ready");

  const setP = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  useEffect(() => {
    const t1 = setTimeout(() => setP("wait"), 1200);
    const delay = 1200 + 1500 + Math.random() * 3500; // random 1.5–5s wait
    const t2 = setTimeout(() => {
      if (phaseRef.current !== "wait") return;
      goAt.current = performance.now();
      sfx.go();
      vibrate(40);
      setP("go");
    }, delay);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const tap = useCallback(
    (p: PlayerId) => {
      const ph = phaseRef.current;
      if (ph === "wait" || ph === "ready") {
        // Too early: false start, the other player wins.
        sfx.wrong();
        setP("done");
        const winner = other(p);
        setResult({ winner, cheat: p });
        onFinish({ winner, detail: `${players[p].name} tap terlalu cepat — curang! 😅` });
      } else if (ph === "go") {
        const ms = Math.round(performance.now() - goAt.current);
        setP("done");
        setResult({ winner: p, ms });
        onFinish({ winner: p, detail: `Waktu reaksi ${ms} ms ⚡` });
      }
    },
    [onFinish, players],
  );
  useTapKeys(tap, phase !== "done");

  const zone = (p: PlayerId) => {
    const won = result?.winner === p;
    const cheated = result?.cheat === p;
    return (
      <TapZone
        player={p}
        onTap={() => tap(p)}
        disabled={phase === "done"}
        className={cn(phase === "go" && "!bg-emerald-500 text-white", phase === "wait" && "!bg-amber-400/30")}
      >
        <span className="text-5xl">{players[p].emoji}</span>
        <span className="font-display text-lg font-semibold">{players[p].name}</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={phase + String(won) + String(cheated)}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-display text-4xl font-bold sm:text-5xl"
          >
            {phase === "ready" && "Bersiap..."}
            {phase === "wait" && "Tunggu... ✋"}
            {phase === "go" && "SEKARANG!"}
            {phase === "done" && (cheated ? "Curang! 🚫" : won ? `Menang! ${result?.ms ? `${result.ms} ms` : ""}` : "Kalah 😵")}
          </motion.span>
        </AnimatePresence>
        <span className="text-sm opacity-70">{phase === "wait" ? "Jangan tap dulu!" : phase === "go" ? "TAP SECEPATNYA!" : " "}</span>
      </TapZone>
    );
  };

  return <SplitScreen p1={zone(1)} p2={zone(2)} center={<div className="h-1 w-full bg-white/60 landscape:h-full landscape:w-1" />} />;
}
