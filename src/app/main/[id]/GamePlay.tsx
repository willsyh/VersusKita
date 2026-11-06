"use client";

import GameShell from "@/components/GameShell";
import { getGame } from "@/games/registry";

export default function GamePlay({ id }: { id: string }) {
  const game = getGame(id);
  if (!game) return null;
  return <GameShell game={game} />;
}
