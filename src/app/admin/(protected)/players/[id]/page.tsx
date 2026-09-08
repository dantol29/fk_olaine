import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { players, teams } from "@/db/schema";

import { PlayerForm } from "./player-form";

export default async function AdminPlayerFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = await db.select().from(teams).orderBy(teams.name);

  if (id === "new") {
    return <PlayerForm mode="create" teamOptions={teamOptions} />;
  }

  const playerId = Number(id);
  const [player] = await db.select().from(players).where(eq(players.id, playerId));
  if (!player) notFound();

  return <PlayerForm mode="edit" player={player} teamOptions={teamOptions} />;
}
