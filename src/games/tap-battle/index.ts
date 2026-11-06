import type { GameDefinition } from "../types";
import TapBattle from "./TapBattle";

export const tapBattle: GameDefinition = {
  id: "tap-battle",
  name: "Tap Battle",
  emoji: "👆",
  tagline: "Siapa paling cepat tap dalam 10 detik?",
  category: "refleks",
  duration: "15 detik",
  mode: "realtime",
  howTo: [
    "Layar dibagi dua: masing-masing pegang sisinya.",
    "Setelah hitungan 3-2-1, tap area kamu secepat mungkin.",
    "Waktu 10 detik. Tap terbanyak menang!",
    "Di laptop: Pemain 1 tekan A, Pemain 2 tekan L.",
  ],
  component: TapBattle,
};
