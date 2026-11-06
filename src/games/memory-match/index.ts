import type { GameDefinition } from "../types";
import MemoryMatch from "./MemoryMatch";

export const memoryMatch: GameDefinition = {
  id: "memory-match",
  name: "Memory Match",
  emoji: "🃏",
  tagline: "Buka kartu, ingat posisinya, kumpulkan pasangan.",
  category: "otak",
  duration: "3-5 menit",
  mode: "turn",
  howTo: [
    "Pemain bergantian membuka 2 kartu.",
    "Kalau gambarnya sama, pasangan jadi milikmu dan kamu boleh buka lagi.",
    "Kalau beda, kartu ditutup lagi dan giliran pindah.",
    "Pasangan terbanyak saat semua kartu terbuka menang.",
  ],
  component: MemoryMatch,
};
