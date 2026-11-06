import type { GameDefinition } from "../types";
import Quiz from "./Quiz";

export const quiz: GameDefinition = {
  id: "quiz",
  name: "Kuis Siapa Paling Tahu",
  emoji: "🧠",
  tagline: "Jawab paling cepat dan benar.",
  category: "kuis",
  duration: "2 menit",
  mode: "realtime",
  howTo: [
    "Ada 7 soal pengetahuan umum, tampil di sisi masing-masing.",
    "Jawaban benar paling cepat dapat 1 poin.",
    "Jawaban salah? Kamu tidak bisa menjawab lagi di soal itu.",
    "Setiap soal punya waktu 15 detik. Poin terbanyak menang!",
  ],
  component: Quiz,
};
