export const PLAYER_COLORS = [
  { id: "biru", label: "Biru", rgb: "59 130 246" },
  { id: "merah", label: "Merah", rgb: "239 68 68" },
  { id: "ungu", label: "Ungu", rgb: "139 92 246" },
  { id: "oranye", label: "Oranye", rgb: "249 115 22" },
  { id: "hijau", label: "Hijau", rgb: "16 185 129" },
  { id: "pink", label: "Pink", rgb: "236 72 153" },
];

export const PLAYER_EMOJIS = ["😎", "🦊", "🐯", "🐼", "🐸", "👻", "🤖", "👽", "🦄", "🐙", "🔥", "⭐"];

export const rgb = (c: string, alpha = 1) => `rgb(${c} / ${alpha})`;

/** "R G B" -> "#rrggbb" (for canvas-confetti and canvas drawing). */
export const toHex = (c: string) =>
  "#" + c.split(" ").map((n) => Number(n).toString(16).padStart(2, "0")).join("");
