import type { GameDefinition } from "../types";
import Penalty from "./Penalty";

export const penalty: GameDefinition = {
  id: "penalty",
  name: "Adu Penalti",
  emoji: "⚽",
  tagline: "Tebak-tebakan arah tendangan vs kiper.",
  category: "keberuntungan",
  duration: "1-2 menit",
  mode: "simultaneous",
  howTo: [
    "Bergantian jadi penendang dan kiper, masing-masing 5 tendangan.",
    "Penendang memilih arah tembakan, kiper menebak arah lompatan. Pilih diam-diam!",
    "Arahnya beda = GOL. Arahnya sama = ditepis.",
    "Gol terbanyak menang. Kalau sama, lanjut sudden death.",
  ],
  component: Penalty,
};
