import type { GameDefinition } from "../types";
import ReactionDuel from "./ReactionDuel";

export const reactionDuel: GameDefinition = {
  id: "reaction-duel",
  name: "Reaction Duel",
  emoji: "⚡",
  tagline: "Tunggu sinyal SEKARANG!, lalu tap tercepat.",
  category: "refleks",
  duration: "10 detik",
  mode: "realtime",
  howTo: [
    "Letakkan jari di atas area masing-masing, tapi jangan tap dulu.",
    "Tunggu sampai layar berubah hijau dan muncul tulisan SEKARANG!",
    "Yang tap paling cepat setelah sinyal menang.",
    "Tap sebelum sinyal = curang, lawan otomatis menang!",
  ],
  component: ReactionDuel,
};
