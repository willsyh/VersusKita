"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { History, Settings } from "lucide-react";
import { useStore, usePlayers } from "@/lib/store";
import SettingsSheet from "./SettingsSheet";

export const HEADER_H = 56;

function ScoreNumber({ value, className }: { value: number; className: string }) {
  return (
    <span className="relative inline-grid w-7 place-items-center overflow-hidden tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 18, opacity: 0, scale: 1.4 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -18, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className={className}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function Header() {
  const players = usePlayers();
  const score = useStore((s) => s.score);
  const [open, setOpen] = useState(false);

  return (
    <>
      <header
        style={{ height: HEADER_H }}
        className="sticky top-0 z-40 flex items-center gap-2 border-b border-black/5 bg-white/75 px-3 backdrop-blur-xl dark:border-white/10 dark:bg-[rgb(13_11_26/0.75)] sm:px-5"
      >
        <Link href="/" aria-label="Beranda" className="flex shrink-0 items-center gap-1 font-display text-lg font-bold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.webp" alt="" width={36} height={36} className="h-9 w-9 rounded-xl" />
          <span className="hidden sm:inline">Versus Kita</span>
        </Link>

        <div className="mx-auto flex min-w-0 items-center gap-1.5 rounded-full bg-black/5 px-2 py-1 font-display text-sm font-semibold dark:bg-white/10 sm:gap-2 sm:px-3 sm:text-base">
          <span className="text-lg leading-none">{players[1].emoji}</span>
          <span className="max-w-[4.5rem] truncate text-p1 sm:max-w-[9rem]">{players[1].name}</span>
          <ScoreNumber value={score[1]} className="text-p1" />
          <span className="opacity-40">–</span>
          <ScoreNumber value={score[2]} className="text-p2" />
          <span className="max-w-[4.5rem] truncate text-p2 sm:max-w-[9rem]">{players[2].name}</span>
          <span className="text-lg leading-none">{players[2].emoji}</span>
        </div>

        <nav className="flex shrink-0 items-center gap-1">
          <Link href="/riwayat" aria-label="Riwayat" className="grid h-9 w-9 place-items-center rounded-xl opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10">
            <History size={20} />
          </Link>
          <button onClick={() => setOpen(true)} aria-label="Pengaturan" className="grid h-9 w-9 place-items-center rounded-xl opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10">
            <Settings size={20} />
          </button>
        </nav>
      </header>
      <SettingsSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
