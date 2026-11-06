import type { GameDefinition } from "../types";
import Gomoku from "./Gomoku";

export const gomoku: GameDefinition = {
  id: "gomoku",
  name: "Lima Sejajar",
  emoji: "⚫",
  tagline: "Seperti tic tac toe, tapi papan besar dan butuh 5.",
  category: "strategi",
  duration: "3-8 menit",
  mode: "turn",
  howTo: [
    "Pemain bergantian meletakkan batu di titik persimpangan.",
    "Susun 5 batu sejajar (mendatar, menurun, atau diagonal) untuk menang.",
    "Hati-hati: blokir barisan lawan yang sudah 3 atau 4!",
    "Papan penuh tanpa pemenang = seri.",
  ],
  component: Gomoku,
};
