import type { GameDefinition } from "../types";
import ThrowDuel from "./ThrowDuel";

export const throwDuel: GameDefinition = {
  id: "throw-duel",
  name: "Duel Lempar",
  emoji: "🎯",
  tagline: "Lempar lawan dari balik pagar. Hati-hati angin!",
  category: "strategi",
  duration: "2-4 menit",
  mode: "turn",
  howTo: [
    "Kalian berdiri di dua sisi pagar dan bergantian melempar.",
    "Sentuh layar, tarik ke belakang seperti ketapel, lalu lepas. Makin jauh ditarik, makin kuat lemparan.",
    "Lihat arah dan kekuatan angin di atas arena. Angin berubah setiap giliran.",
    "Kena badan = 22-30, kena kepala = 35-40, jatuh di dekat lawan = cipratan kecil. HP lawan habis duluan = menang!",
  ],
  component: ThrowDuel,
};
