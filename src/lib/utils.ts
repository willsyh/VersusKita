import type { PlayerId } from "@/games/types";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const other = (p: PlayerId): PlayerId => (p === 1 ? 2 : 1);

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
