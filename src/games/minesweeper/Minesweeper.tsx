"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bomb, Flag, Pickaxe } from "lucide-react";
import type { GameProps, PlayerId } from "../types";
import TurnBanner from "@/components/TurnBanner";
import { usePortrait } from "@/components/SplitScreen";
import { sfx, vibrate } from "@/lib/sound";
import { cn, other } from "@/lib/utils";

type Level = "beginner" | "intermediate" | "expert";

// Classic Minesweeper sizes (rows x cols on a landscape screen).
const LEVELS: Record<Level, { label: string; rows: number; cols: number; mines: number }> = {
  beginner: { label: "Beginner", rows: 9, cols: 9, mines: 10 },
  intermediate: { label: "Intermediate", rows: 16, cols: 16, mines: 40 },
  expert: { label: "Expert", rows: 16, cols: 30, mines: 99 },
};

const STORAGE_KEY = "vk-minesweeper-level";
const NUMBER_COLOR = ["", "#2563eb", "#16a34a", "#dc2626", "#1e3a8a", "#9f1239", "#0d9488", "#111827", "#6b7280"];
const LONG_PRESS_MS = 380;

function loadLevel(): Level {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && v in LEVELS) return v as Level;
  } catch {}
  return "beginner";
}

function neighbors(i: number, rows: number, cols: number) {
  const r = Math.floor(i / cols), c = i % cols;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) out.push(rr * cols + cc);
    }
  return out;
}

/** Places mines, keeping the first clicked cell and its neighbors safe. */
function placeMines(rows: number, cols: number, count: number, safe: number): boolean[] {
  const total = rows * cols;
  const banned = new Set([safe, ...neighbors(safe, rows, cols)]);
  const pool = Array.from({ length: total }, (_, i) => i).filter((i) => !banned.has(i));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const mines = Array(total).fill(false);
  pool.slice(0, count).forEach((i) => (mines[i] = true));
  return mines;
}

/** Who opened each cell: a player, 0 for the free opening move, or null if hidden. */
type Owner = PlayerId | 0 | null;

export default function Minesweeper({ players, startingPlayer, onFinish }: GameProps) {
  const [level, setLevel] = useState<Level>(loadLevel);
  const { rows, cols, mines: mineCount } = LEVELS[level];
  const total = rows * cols;

  const [mines, setMines] = useState<boolean[] | null>(null); // created on the first click
  const [opened, setOpened] = useState<Owner[]>(() => Array(total).fill(null));
  const [flags, setFlags] = useState<(PlayerId | null)[]>(() => Array(total).fill(null));
  const [turn, setTurn] = useState<PlayerId>(startingPlayer);
  const [flagMode, setFlagMode] = useState(false);
  const [exploded, setExploded] = useState<number | null>(null);
  const [over, setOver] = useState(false);

  const started = mines !== null;
  const counts = mines ? mines.map((_, i) => neighbors(i, rows, cols).filter((n) => mines[n]).length) : [];
  const scores = { 1: 0, 2: 0 } as Record<PlayerId, number>;
  opened.forEach((o) => o && scores[o]++);
  const flagCount = flags.filter(Boolean).length;

  const changeLevel = (l: Level) => {
    if (started) return;
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
    const n = LEVELS[l].rows * LEVELS[l].cols;
    setLevel(l);
    setOpened(Array(n).fill(null));
    setFlags(Array(n).fill(null));
  };

  /** Flood-fills from the given cells and returns the new opened array. */
  const reveal = (start: number[], m: boolean[], cnt: number[], base: Owner[], by: PlayerId | 0) => {
    const next = [...base];
    const stack = [...start];
    while (stack.length) {
      const i = stack.pop()!;
      if (next[i] !== null || flags[i]) continue;
      next[i] = by;
      if (!m[i] && cnt[i] === 0) stack.push(...neighbors(i, rows, cols));
    }
    return next;
  };

  const toggleFlag = (i: number) => {
    if (over || opened[i] !== null) return;
    sfx.tap();
    const next = [...flags];
    next[i] = next[i] ? null : turn;
    setFlags(next); // placing a flag does not end the turn
  };

  const finish = (winner: PlayerId | null, detail: string) => {
    setOver(true);
    onFinish({ winner, detail });
  };

  const open = (i: number) => {
    if (over || flags[i]) return;

    // First click: build the board around it. The opening is free (counts for nobody).
    if (!mines) {
      const m = placeMines(rows, cols, mineCount, i);
      const cnt = m.map((_, k) => neighbors(k, rows, cols).filter((n) => m[n]).length);
      setMines(m);
      setOpened(reveal([i], m, cnt, opened, 0));
      sfx.correct();
      setTurn(other(turn));
      return;
    }

    let targets: number[];
    if (opened[i] === null) targets = [i];
    else {
      // Chord: tapping a number whose flags are all placed opens the rest around it.
      const around = neighbors(i, rows, cols);
      const flagged = around.filter((n) => flags[n]).length;
      if (counts[i] === 0 || flagged !== counts[i]) return;
      targets = around.filter((n) => opened[n] === null && !flags[n]);
      if (!targets.length) return;
    }

    const next = reveal(targets, mines, counts, opened, turn);
    setOpened(next);
    const boom = targets.find((t) => mines[t]);
    if (boom !== undefined) {
      setExploded(boom);
      sfx.wrong();
      vibrate([150, 60, 250]);
      return finish(other(turn), `${players[turn].name} membuka bom!`);
    }
    sfx.place();

    const safeLeft = next.filter((o, k) => o === null && !mines[k]).length;
    if (safeLeft === 0) {
      const s = { 1: 0, 2: 0 };
      next.forEach((o) => o && s[o]++);
      return finish(s[1] === s[2] ? null : s[1] > s[2] ? 1 : 2, `Papan bersih! ${s[1]} – ${s[2]} kotak`);
    }
    setTurn(other(turn));
  };

  // --- Layout: fit the board in the available space (transposed on portrait screens) ---
  const portrait = usePortrait();
  const transpose = portrait && cols > rows;
  const dRows = transpose ? cols : rows;
  const dCols = transpose ? rows : cols;
  const areaRef = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState(28);
  useEffect(() => {
    const el = areaRef.current!;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      // Subtract the 1px gaps between cells.
      const byWidth = Math.floor((width - 8 - dCols) / dCols);
      const size = Math.min(byWidth, Math.floor((height - 8 - dRows) / dRows), 44);
      // Too small to tap comfortably? Fit the width instead and let the board scroll.
      setCell(size >= 22 ? size : Math.max(18, Math.min(byWidth, 30)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dRows, dCols]);

  // Long press = flag (touch). Right click = flag (mouse).
  const press = useRef<{ i: number; timer: ReturnType<typeof setTimeout>; fired: boolean } | null>(null);
  // Only the primary button / a finger opens cells; right click is handled by onContextMenu.
  const onDown = (e: React.PointerEvent, i: number) => {
    if (e.button !== 0) return;
    const p = { i, fired: false, timer: setTimeout(() => {
      p.fired = true;
      toggleFlag(i);
      vibrate(25);
    }, LONG_PRESS_MS) };
    press.current = p;
  };
  const onUp = (e: React.PointerEvent, i: number) => {
    if (e.button !== 0) return;
    const p = press.current;
    press.current = null;
    if (!p) return;
    clearTimeout(p.timer);
    if (p.fired || p.i !== i) return;
    if (flagMode && opened[i] === null) toggleFlag(i);
    else open(i);
  };
  const cancelPress = () => {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  };

  const cells: React.ReactNode[] = [];
  for (let dr = 0; dr < dRows; dr++)
    for (let dc = 0; dc < dCols; dc++) {
      const i = transpose ? dc * cols + dr : dr * cols + dc;
      const o = opened[i];
      const isMine = mines?.[i];
      const showMine = isMine && (o !== null || over);
      const flag = flags[i];
      cells.push(
        <button
          key={i}
          onPointerDown={(e) => onDown(e, i)}
          onPointerUp={(e) => onUp(e, i)}
          onPointerLeave={cancelPress}
          onPointerCancel={cancelPress}
          onContextMenu={(e) => {
            e.preventDefault();
            cancelPress();
            toggleFlag(i);
          }}
          aria-label={`Kotak ${Math.floor(i / cols) + 1}-${(i % cols) + 1}`}
          style={{ width: cell, height: cell, fontSize: cell * 0.58 }}
          className={cn(
            "tap-zone grid place-items-center font-display font-bold leading-none",
            o === null && !showMine
              ? "rounded-[22%] bg-slate-300 shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-slate-200 dark:bg-slate-600 dark:hover:bg-slate-500"
              : "bg-white dark:bg-slate-800",
            o === 1 && "bg-p1/15 dark:bg-p1/25",
            o === 2 && "bg-p2/15 dark:bg-p2/25",
            exploded === i && "!bg-red-500",
          )}
        >
          {showMine ? (
            <Bomb className={exploded === i ? "text-white" : "text-slate-800 dark:text-slate-200"} style={{ width: cell * 0.62, height: cell * 0.62 }} />
          ) : flag && o === null ? (
            <Flag style={{ width: cell * 0.55, height: cell * 0.55, color: `rgb(var(--p${flag}))` }} fill="currentColor" />
          ) : o !== null && counts[i] > 0 ? (
            <span style={{ color: NUMBER_COLOR[counts[i]] }}>{counts[i]}</span>
          ) : null}
        </button>,
      );
    }

  return (
    <div className="flex h-full flex-col items-center gap-2 p-2 sm:gap-3 sm:p-3">
      <TurnBanner players={players} turn={over ? null : turn} scores={scores} label={started ? "Giliran" : "Buka kotak pertama"} />

      {/* Difficulty: can be changed until the first cell is opened */}
      <div className="grid w-full max-w-md grid-cols-3 gap-1 rounded-2xl bg-black/5 p-1 dark:bg-white/5">
        {(Object.keys(LEVELS) as Level[]).map((l) => (
          <button
            key={l}
            onClick={() => changeLevel(l)}
            disabled={started && l !== level}
            className={cn(
              "rounded-xl px-1 py-1.5 text-center transition disabled:opacity-35",
              level === l ? "bg-white shadow-sm dark:bg-white/15" : "hover:bg-black/5 dark:hover:bg-white/10",
            )}
          >
            <span className="block font-display text-sm font-semibold">{LEVELS[l].label}</span>
            <span className="block text-[10px] opacity-60">
              {LEVELS[l].cols}×{LEVELS[l].rows} · {LEVELS[l].mines} bom
            </span>
          </button>
        ))}
      </div>

      <div className="flex w-full max-w-md items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 font-semibold">
          <Bomb size={16} /> {mineCount - flagCount}
        </span>
        <div className="flex rounded-xl bg-black/5 p-0.5 dark:bg-white/10">
          <button onClick={() => setFlagMode(false)} className={cn("flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold", !flagMode && "bg-white shadow-sm dark:bg-white/15")}>
            <Pickaxe size={15} /> Buka
          </button>
          <button onClick={() => setFlagMode(true)} className={cn("flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold", flagMode && "bg-white shadow-sm dark:bg-white/15")}>
            <Flag size={15} /> Bendera
          </button>
        </div>
      </div>

      <div ref={areaRef} className="flex min-h-0 w-full flex-1 items-start justify-center overflow-auto">
        <motion.div
          key={level}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid gap-px rounded-lg bg-slate-400/60 p-px dark:bg-slate-900"
          style={{ gridTemplateColumns: `repeat(${dCols}, ${cell}px)` }}
        >
          {cells}
        </motion.div>
      </div>
    </div>
  );
}
