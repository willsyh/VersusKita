import { CircleHelp, Clover, Crown, Gamepad2, Puzzle, Zap, type LucideIcon } from "lucide-react";
import type { Category } from "@/games/types";

/** Icon per game category (used in filter chips and game cards). */
export const CATEGORY_ICON: Record<Category | "semua", LucideIcon> = {
  semua: Gamepad2,
  strategi: Crown,
  refleks: Zap,
  otak: Puzzle,
  keberuntungan: Clover,
  kuis: CircleHelp,
};
