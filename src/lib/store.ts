"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Player, PlayerId } from "@/games/types";
import { PLAYER_COLORS } from "./colors";

export interface MatchRecord {
  id: string;
  /** Game id, or "turnamen" for a tournament champion entry. */
  gameId: string;
  winner: PlayerId;
  /** Names at the time of the match, so renames don't rewrite history. */
  p1Name: string;
  p2Name: string;
  /** Series score, e.g. "2-1" */
  score?: string;
  tournament?: boolean;
  at: number;
}

export interface Settings {
  sound: boolean;
  vibration: boolean;
  punishment: boolean;
  dark: boolean;
}

interface State {
  players: Record<PlayerId, Player>;
  score: Record<PlayerId, number>;
  history: MatchRecord[];
  settings: Settings;
  setPlayer: (id: PlayerId, patch: Partial<Player>) => void;
  /** Adds a history entry. countScore=false for entries that shouldn't touch the global score. */
  recordWin: (rec: Omit<MatchRecord, "id" | "at" | "p1Name" | "p2Name">, countScore?: boolean) => void;
  resetScore: () => void;
  clearHistory: () => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      players: {
        1: { name: "", emoji: "😎", color: PLAYER_COLORS[0].rgb },
        2: { name: "", emoji: "🦊", color: PLAYER_COLORS[1].rgb },
      },
      score: { 1: 0, 2: 0 },
      history: [],
      settings: { sound: true, vibration: true, punishment: false, dark: false },
      setPlayer: (id, patch) =>
        set((s) => ({ players: { ...s.players, [id]: { ...s.players[id], ...patch } } })),
      recordWin: (rec, countScore = true) => {
        const { players, score, history } = get();
        const entry: MatchRecord = {
          ...rec,
          id: Math.random().toString(36).slice(2, 10),
          at: Date.now(),
          p1Name: displayName(players[1], 1),
          p2Name: displayName(players[2], 2),
        };
        set({
          score: countScore ? { ...score, [rec.winner]: score[rec.winner] + 1 } : score,
          history: [entry, ...history].slice(0, 200),
        });
      },
      resetScore: () => set({ score: { 1: 0, 2: 0 } }),
      clearHistory: () => set({ history: [] }),
      setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),
    }),
    {
      name: "versus-kita",
      version: 1,
      partialize: ({ players, score, history, settings }) => ({ players, score, history, settings }),
    },
  ),
);

/** Display name with a fallback when the input is empty. */
export const displayName = (p: Player, id: PlayerId) => p.name.trim() || `Pemain ${id}`;

/** Players with fallback names filled in, for use inside games. */
export function usePlayers(): Record<PlayerId, Player> {
  const players = useStore((s) => s.players);
  return useMemo(
    () => ({
      1: { ...players[1], name: displayName(players[1], 1) },
      2: { ...players[2], name: displayName(players[2], 2) },
    }),
    [players],
  );
}
