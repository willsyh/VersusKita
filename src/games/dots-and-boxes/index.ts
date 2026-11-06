import type { GameDefinition } from "../types";
import DotsAndBoxes from "./DotsAndBoxes";

export const dotsAndBoxes: GameDefinition = {
  id: "dots-and-boxes",
  name: "Dots and Boxes",
  emoji: "🔲",
  tagline: "Tarik garis, kuasai kotak terbanyak.",
  category: "otak",
  duration: "3-5 menit",
  mode: "turn",
  howTo: [
    "Pemain bergantian mengetuk garis di antara dua titik.",
    "Siapa yang menutup sisi keempat sebuah kotak, kotak itu miliknya.",
    "Menutup kotak = dapat giliran lagi!",
    "Kotak terbanyak di akhir permainan menang.",
  ],
  component: DotsAndBoxes,
};
