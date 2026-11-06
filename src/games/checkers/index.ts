import type { GameDefinition } from "../types";
import Checkers from "./Checkers";

export const checkers: GameDefinition = {
  id: "checkers",
  name: "Dam",
  emoji: "🏁",
  tagline: "Lompati dan makan bidak lawan.",
  category: "strategi",
  duration: "5-15 menit",
  mode: "turn",
  howTo: [
    "Bidak jalan miring 1 kotak ke depan.",
    "Makan bidak lawan dengan melompatinya. Makan itu wajib, boleh maju atau mundur.",
    "Kalau setelah makan masih bisa makan lagi, bidak yang sama wajib lanjut.",
    "Sampai di baris paling ujung = jadi Raja (bisa jalan mundur). Habiskan atau kunci semua bidak lawan untuk menang.",
  ],
  component: Checkers,
};
