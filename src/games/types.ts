import type { ComponentType } from "react";

export type PlayerId = 1 | 2;

export interface Player {
  name: string;
  emoji: string;
  /** Color as "R G B" so it can be used in CSS variables. */
  color: string;
}

export type Category = "strategi" | "refleks" | "otak" | "keberuntungan" | "kuis";

export interface GameResult {
  /** null means a draw; the round is replayed in a series. */
  winner: PlayerId | null;
  /** Optional short note shown on the round screen, e.g. "245 ms". */
  detail?: string;
}

/** Every game component receives exactly these props. */
export interface GameProps {
  players: Record<PlayerId, Player>;
  /** Who moves first this round (alternates between rounds). */
  startingPlayer: PlayerId;
  /** Call once when the round is over. */
  onFinish: (result: GameResult) => void;
}

export interface GameDefinition {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  category: Category;
  /** Estimated time per round, e.g. "1-2 menit". */
  duration: string;
  /** turn = bergiliran, realtime = layar dibagi dua, simultaneous = pilih bersamaan */
  mode: "turn" | "realtime" | "simultaneous";
  howTo: string[];
  /** Long games (e.g. chess) are skipped by Turnamen Acak. */
  skipInTournament?: boolean;
  component: ComponentType<GameProps>;
}

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "strategi", label: "Strategi" },
  { id: "refleks", label: "Refleks" },
  { id: "otak", label: "Otak/Puzzle" },
  { id: "keberuntungan", label: "Keberuntungan" },
  { id: "kuis", label: "Kuis" },
];

export const MODE_LABEL: Record<GameDefinition["mode"], string> = {
  turn: "Bergiliran",
  realtime: "Layar dibagi",
  simultaneous: "Bersamaan",
};
