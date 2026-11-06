import type { GameDefinition } from "../types";
import Pong from "./Pong";

export const pong: GameDefinition = {
  id: "pong",
  name: "Pong",
  emoji: "🏓",
  tagline: "Pantulkan bola, jangan sampai kebobolan.",
  category: "refleks",
  duration: "2-3 menit",
  mode: "realtime",
  howTo: [
    "Geser jari di sisimu untuk menggerakkan paddle.",
    "Pantulkan bola ke arah lawan. Bola makin lama makin cepat!",
    "Kebobolan = lawan dapat poin.",
    "Pertama mencapai 5 poin menang. Di laptop: W/S dan panah ↑/↓.",
  ],
  component: Pong,
};
