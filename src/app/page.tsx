"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock, Globe, Smartphone, Trophy } from "lucide-react";
import { CATEGORY_ICON } from "@/components/icons";
import PlayerSetup from "@/components/PlayerSetup";
import { GAMES } from "@/games/registry";
import { CATEGORIES, MODE_LABEL, type Category } from "@/games/types";

import { cn } from "@/lib/utils";

const LOGO_MASK =
  "linear-gradient(to right, transparent, #000 5%, #000 95%, transparent), linear-gradient(to bottom, transparent, #000 8%, #000 92%, transparent)";

export default function HomePage() {
  const [filter, setFilter] = useState<Category | "semua">("semua");
  const games = filter === "semua" ? GAMES : GAMES.filter((g) => g.category === filter);

  return (
    <main className="bg-versus min-h-[calc(100dvh-56px)]">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:pt-12">
        {/* Hero */}
        {/* The logo artwork has a black background, so it sits on a dark panel in both themes. */}
        <section className="relative overflow-hidden rounded-[2rem] bg-[#000005] px-4 pb-6 pt-4 text-center shadow-2xl ring-1 ring-white/10 sm:pb-8">
          <div className="pointer-events-none absolute -left-16 top-1/3 h-56 w-56 rounded-full bg-blue-600/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-1/4 h-56 w-56 rounded-full bg-orange-600/25 blur-3xl" />
          <h1 className="sr-only">Versus Kita</h1>
          <motion.img
            src="/logo.webp"
            alt="Logo Versus Kita"
            width={1310}
            height={755}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [1, 1.02, 1], opacity: 1 }}
            transition={{ scale: { repeat: Infinity, duration: 3, ease: "easeInOut" }, opacity: { duration: 0.5 } }}
            // Fade the artwork edges so its own black background blends into the panel.
            style={{ maskImage: LOGO_MASK, WebkitMaskImage: LOGO_MASK, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
            className="relative mx-auto w-full max-w-xl"
          />
          <p className="relative -mt-2 text-lg font-semibold text-white/80 sm:-mt-4 sm:text-xl">Siapa yang paling jago di antara kita?</p>
        </section>

        {/* Players */}
        <section className="mt-8">
          <PlayerSetup />
        </section>

        {/* Mode */}
        <section className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-black/5 p-1 text-sm font-semibold dark:bg-white/5 sm:mx-auto sm:max-w-md">
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-white py-2 shadow-sm dark:bg-white/15">
            <Smartphone size={16} /> Satu Perangkat
          </div>
          <div className="flex items-center justify-center gap-1.5 py-2 text-center opacity-50" title="Segera hadir">
            <Globe size={16} /> Online <span className="chip bg-black/10 px-2 py-0.5 text-[10px] dark:bg-white/10">Segera</span>
          </div>
        </section>

        {/* Tournament */}
        <Link href="/turnamen" className="group mt-6 block">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-p1 to-p2 p-5 text-white shadow-xl transition group-hover:scale-[1.01] group-active:scale-[0.99]">
            <Trophy className="absolute -right-3 -top-3 opacity-20 transition group-hover:rotate-12" size={112} strokeWidth={1.5} />
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Mode Turnamen Acak</p>
            <h2 className="font-display text-2xl font-bold">5 game acak, 1 juara sejati</h2>
            <p className="mt-1 text-sm opacity-90"><span className="inline-flex items-center gap-1">
                Sistem memilih 5 game berturut-turut. Siap diuji? <ArrowRight size={14} />
              </span>
            </p>
          </div>
        </Link>

        {/* Filter */}
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold">Pilih Game</h2>
            <span className="text-sm opacity-60">{games.length} game</span>
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
            {[{ id: "semua" as const, label: "Semua" }, ...CATEGORIES].map((c) => {
              const Icon = CATEGORY_ICON[c.id];
              return (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition",
                  filter === c.id ? "bg-gradient-to-r from-p1 to-p2 text-white shadow-md" : "bg-black/5 hover:bg-black/10 dark:bg-white/10",
                )}
              >
                <Icon size={15} /> {c.label}
              </button>
              );
            })}
          </div>

          {/* Grid */}
          <motion.div layout className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {games.map((g, i) => {
                const cat = CATEGORIES.find((c) => c.id === g.category)!;
                const CatIcon = CATEGORY_ICON[g.category];
                return (
                  <motion.div
                    key={g.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Link href={`/main/${g.id}`} className="card group flex h-full flex-col p-4 transition hover:-translate-y-1 active:scale-[0.98]">
                      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-p1/15 to-p2/15 text-3xl transition group-hover:scale-110 group-hover:animate-wiggle">
                        {g.emoji}
                      </div>
                      <h3 className="font-display text-lg font-semibold leading-tight">{g.name}</h3>
                      <p className="mt-1 line-clamp-2 flex-1 text-sm opacity-65">{g.tagline}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        <span className="chip bg-black/5 px-2 dark:bg-white/10">
                          <CatIcon size={12} /> {cat.label}
                        </span>
                        <span className="chip bg-black/5 px-2 dark:bg-white/10">
                          <Clock size={12} /> {g.duration}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider opacity-50">{MODE_LABEL[g.mode]}</p>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
