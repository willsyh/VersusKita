import type { GameDefinition } from "../types";
import TicTacToe from "./TicTacToe";

export const ticTacToe: GameDefinition = {
  id: "tic-tac-toe",
  name: "Tic Tac Toe",
  emoji: "❌",
  tagline: "Klasik 3x3. Susun tiga sejajar duluan!",
  category: "strategi",
  duration: "1 menit",
  mode: "turn",
  howTo: [
    "Pemain bergantian mengetuk kotak kosong.",
    "Pemain 1 memakai ✕, Pemain 2 memakai ◯.",
    "Susun 3 simbol sejajar (mendatar, menurun, atau diagonal) untuk menang.",
    "Kalau papan penuh tanpa pemenang, ronde seri dan diulang.",
  ],
  component: TicTacToe,
};
