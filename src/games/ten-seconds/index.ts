import type { GameDefinition } from "../types";
import TenSeconds from "./TenSeconds";

export const tenSeconds: GameDefinition = {
  id: "ten-seconds",
  name: "Stop di 10 Detik",
  emoji: "⏱️",
  tagline: "Tantangan viral: stop tepat di 10.00 detik.",
  category: "refleks",
  duration: "15 detik",
  mode: "realtime",
  howTo: [
    "Setelah hitungan 3-2-1, waktu mulai berjalan untuk kalian berdua.",
    "Angka hanya terlihat 3 detik pertama, setelah itu hitung dalam hati!",
    "Tap areamu saat kamu yakin sudah tepat 10 detik.",
    "Yang paling dekat dengan 10.00 detik menang. Di laptop: A dan L.",
  ],
  component: TenSeconds,
};
