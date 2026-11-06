import { notFound } from "next/navigation";
import { GAMES } from "@/games/registry";
import GamePlay from "./GamePlay";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!GAMES.some((g) => g.id === id)) notFound();
  return <GamePlay id={id} />;
}
