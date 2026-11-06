import type { GameDefinition } from "../types";
import Chess from "./Chess";

export const chess: GameDefinition = {
  id: "chess",
  name: "Catur",
  emoji: "♟️",
  tagline: "Duel otak klasik. Skakmat raja lawan!",
  category: "strategi",
  duration: "10-30 menit",
  mode: "turn",
  howTo: [
    "Pemain yang mulai memegang bidak putih (outline putih) dan jalan duluan.",
    "Ketuk bidak untuk melihat langkah yang boleh, lalu ketuk tujuannya.",
    "Rokade, en passant, dan promosi pion semuanya berlaku.",
    "Skakmat raja lawan untuk menang. Ada tombol Putar papan, Seri, dan Menyerah.",
  ],
  skipInTournament: true,
  component: Chess,
};
