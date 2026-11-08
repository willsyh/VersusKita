import type { GameDefinition } from "../types";
import Minesweeper from "./Minesweeper";

export const minesweeper: GameDefinition = {
  id: "minesweeper",
  name: "Minesweeper Duel",
  emoji: "💣",
  tagline: "Buka kotak bergantian. Jangan sampai kena bom!",
  category: "otak",
  duration: "3-10 menit",
  mode: "turn",
  howTo: [
    "Pilih tingkat kesulitan: Beginner (9×9), Intermediate (16×16), atau Expert (30×16).",
    "Bergiliran membuka 1 kotak. Angka menunjukkan jumlah bom di sekitar kotak itu. Kotak pertama selalu aman dan tidak dihitung.",
    "Tekan lama, klik kanan, atau pakai mode Bendera untuk menandai bom. Memasang bendera tidak menghabiskan giliran.",
    "Yang membuka bom langsung kalah. Kalau papan bersih, yang membuka kotak terbanyak menang.",
  ],
  component: Minesweeper,
};
