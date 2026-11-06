import type { GameDefinition } from "../types";
import ColorMatch from "./ColorMatch";

export const colorMatch: GameDefinition = {
  id: "color-match",
  name: "Tebak Warna",
  emoji: "🎨",
  tagline: "Tes otak viral: kata vs warna tulisannya.",
  category: "otak",
  duration: "1-2 menit",
  mode: "realtime",
  howTo: [
    "Muncul nama warna, tapi warna tulisannya bisa berbeda. Contoh: kata MERAH ditulis warna biru.",
    "Tekan Benar kalau warna tulisan sama dengan katanya, Salah kalau berbeda.",
    "Jawaban benar paling cepat dapat 1 poin. Salah jawab = terkunci di soal itu.",
    "Pertama mencapai 7 poin menang. Otakmu pasti tertipu!",
  ],
  component: ColorMatch,
};
