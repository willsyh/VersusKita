"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps, PlayerId } from "../types";
import TurnBanner from "@/components/TurnBanner";
import { sfx } from "@/lib/sound";
import { cn, other, shuffle } from "@/lib/utils";

const ICONS = ["🍕", "🚀", "🐱", "🌈", "🎸", "🍩", "⚽", "🦋"];

interface Card {
  id: number;
  icon: string;
  owner: PlayerId | null;
}

export default function MemoryMatch({ players, startingPlayer, onFinish }: GameProps) {
  const [cards, setCards] = useState<Card[]>(() => shuffle([...ICONS, ...ICONS]).map((icon, id) => ({ id, icon, owner: null })));
  const [open, setOpen] = useState<number[]>([]);
  const [turn, setTurn] = useState<PlayerId>(startingPlayer);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const scores = { 1: 0, 2: 0 } as Record<PlayerId, number>;
  cards.forEach((c) => c.owner && scores[c.owner]++);
  scores[1] /= 2;
  scores[2] /= 2;
  const done = cards.every((c) => c.owner);

  const flip = (i: number) => {
    if (open.length === 2 || open.includes(i) || cards[i].owner || done) return;
    sfx.flip();
    const nowOpen = [...open, i];
    setOpen(nowOpen);
    if (nowOpen.length < 2) return;

    const [a, b] = nowOpen;
    if (cards[a].icon === cards[b].icon) {
      timer.current = setTimeout(() => {
        sfx.correct();
        const next = cards.map((c, idx) => (idx === a || idx === b ? { ...c, owner: turn } : c));
        setCards(next);
        setOpen([]);
        if (next.every((c) => c.owner)) {
          const s = { 1: 0, 2: 0 };
          next.forEach((c) => c.owner && s[c.owner]++);
          const p1 = s[1] / 2, p2 = s[2] / 2;
          onFinish({ winner: p1 === p2 ? null : p1 > p2 ? 1 : 2, detail: `${p1} – ${p2} pasang` });
        }
        // A match keeps the turn.
      }, 450);
    } else {
      timer.current = setTimeout(() => {
        setOpen([]);
        setTurn((t) => other(t));
      }, 950);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-3">
      <TurnBanner players={players} turn={done ? null : turn} scores={scores} />
      <div className="grid w-full max-w-[min(92vw,440px)] grid-cols-4 gap-2 sm:gap-3">
        {cards.map((card, i) => {
          const faceUp = open.includes(i) || !!card.owner;
          return (
            <button key={card.id} onClick={() => flip(i)} className="aspect-square [perspective:600px]" aria-label={faceUp ? card.icon : "Kartu tertutup"}>
              <motion.div
                animate={{ rotateY: faceUp ? 180 : 0 }}
                transition={{ duration: 0.35 }}
                className="relative h-full w-full [transform-style:preserve-3d]"
              >
                <div className="absolute inset-0 grid place-items-center rounded-2xl bg-gradient-to-br from-p1 to-p2 text-2xl text-white/70 shadow-md [backface-visibility:hidden]">
                  ?
                </div>
                <div
                  className={cn(
                    "absolute inset-0 grid place-items-center rounded-2xl border-4 bg-white text-3xl shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)] dark:bg-white/10 sm:text-4xl",
                    card.owner === 1 ? "border-p1" : card.owner === 2 ? "border-p2" : "border-transparent",
                  )}
                >
                  {card.icon}
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>
      <p className="text-sm opacity-60">Dapat pasangan = boleh buka lagi</p>
    </div>
  );
}
