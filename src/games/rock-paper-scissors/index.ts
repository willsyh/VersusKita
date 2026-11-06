import type { GameDefinition } from "../types";
import RockPaperScissors from "./RockPaperScissors";

export const rockPaperScissors: GameDefinition = {
  id: "rock-paper-scissors",
  name: "Batu Gunting Kertas",
  emoji: "✊",
  tagline: "Pilih diam-diam, buka bersamaan.",
  category: "keberuntungan",
  duration: "10 detik",
  mode: "simultaneous",
  howTo: [
    "Masing-masing pilih Batu, Gunting, atau Kertas di sisinya.",
    "Pilihan disembunyikan sampai kedua pemain sudah memilih.",
    "Batu menang lawan Gunting, Gunting menang lawan Kertas, Kertas menang lawan Batu.",
    "Di laptop: Pemain 1 pakai A/S/D, Pemain 2 pakai J/K/L.",
  ],
  component: RockPaperScissors,
};
