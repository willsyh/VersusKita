import type { GameDefinition } from "../types";
import Basketball from "./Basketball";

export const basketball: GameDefinition = {
  id: "basketball",
  name: "Duel Basket",
  emoji: "🏀",
  tagline: "Tarik bola, ikuti garis lintasan, masukkan ke ring!",
  category: "refleks",
  duration: "40 detik",
  mode: "realtime",
  howTo: [
    "Masing-masing punya ring sendiri di sisi layarnya. Main bersamaan selama 30 detik.",
    "Sentuh lalu tarik ke bawah seperti ketapel. Garis titik-titik menunjukkan lintasan bola ke ring.",
    "Lepas untuk menembak. Masuk = 2 poin, masuk tanpa kena ring (swish) = 3 poin.",
    "Setelah 3 kali masuk, ring mulai bergerak. Poin terbanyak menang!",
  ],
  component: Basketball,
};
