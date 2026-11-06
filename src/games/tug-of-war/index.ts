import type { GameDefinition } from "../types";
import TugOfWar from "./TugOfWar";

export const tugOfWar: GameDefinition = {
  id: "tug-of-war",
  name: "Tarik Tambang",
  emoji: "🪢",
  tagline: "Spam tap untuk menarik tali ke sisimu!",
  category: "refleks",
  duration: "20-40 detik",
  mode: "realtime",
  howTo: [
    "Setiap tap menarik tali ke arah sisimu.",
    "Tali pelan-pelan kembali ke tengah, jadi terus tap!",
    "Tarik bendera sampai garis sisimu untuk menang.",
    "Di laptop: Pemain 1 tekan A, Pemain 2 tekan L.",
  ],
  component: TugOfWar,
};
