import type { GameDefinition } from "../types";
import Congklak from "./Congklak";

export const congklak: GameDefinition = {
  id: "congklak",
  name: "Congklak",
  emoji: "🫘",
  tagline: "Permainan tradisional: kumpulkan biji terbanyak.",
  category: "strategi",
  duration: "5-10 menit",
  mode: "turn",
  howTo: [
    "Ketuk salah satu lubang di barismu. Bijinya dibagikan satu-satu berlawanan arah jarum jam.",
    "Biji terakhir masuk lumbungmu = main lagi. Jatuh di lubang berisi = ambil semua isinya dan lanjut membagi.",
    "Jatuh di lubang kosong milikmu = tembak: ambil biji di lubang seberang ke lumbungmu.",
    "Jatuh di lubang kosong milik lawan = giliran selesai. Biji terbanyak di lumbung menang.",
  ],
  component: Congklak,
};
