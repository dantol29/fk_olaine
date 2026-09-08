import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { teams } from "@/db/schema";

import { TeamForm } from "./team-form";

export default async function AdminTeamFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") {
    return <TeamForm mode="create" />;
  }

  const teamId = Number(id);
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) notFound();

  return <TeamForm mode="edit" team={team} />;
}
