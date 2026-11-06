import type { GameDefinition } from "../types";
import ConnectFour from "./ConnectFour";

export const connectFour: GameDefinition = {
  id: "connect-four",
  name: "Connect Four",
  emoji: "🔴",
  tagline: "Jatuhkan koin, susun 4 sejajar.",
  category: "strategi",
  duration: "2-4 menit",
  mode: "turn",
  howTo: [
    "Ketuk sebuah kolom untuk menjatuhkan koin ke posisi paling bawah.",
    "Pemain bergantian menjatuhkan koin.",
    "Susun 4 koin sejajar: mendatar, menurun, atau diagonal.",
    "Papan penuh tanpa pemenang = seri.",
  ],
  component: ConnectFour,
};
