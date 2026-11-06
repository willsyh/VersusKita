import type { GameDefinition } from "../types";
import MathDuel from "./MathDuel";

export const mathDuel: GameDefinition = {
  id: "math-duel",
  name: "Adu Hitung Cepat",
  emoji: "➗",
  tagline: "Benar atau salah? Jawab lebih cepat dari lawan.",
  category: "otak",
  duration: "1-2 menit",
  mode: "realtime",
  howTo: [
    "Muncul soal hitungan beserta hasilnya, misalnya 7 × 8 = 54.",
    "Tekan Benar atau Salah secepat mungkin.",
    "Jawaban benar paling cepat dapat 1 poin. Salah jawab = tidak bisa menjawab soal itu lagi.",
    "Pertama mencapai 7 poin menang.",
  ],
  component: MathDuel,
};
