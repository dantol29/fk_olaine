import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { games, teams } from "@/db/schema";

import { GameForm } from "./game-form";

export default async function AdminGameFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = await db.select().from(teams).orderBy(teams.name);

  if (id === "new") {
    return <GameForm mode="create" teamOptions={teamOptions} />;
  }

  const gameId = Number(id);
  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  if (!game) notFound();

  return <GameForm mode="edit" game={game} teamOptions={teamOptions} />;
}
