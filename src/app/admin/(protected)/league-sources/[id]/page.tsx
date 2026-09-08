import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { leagueSources, teams } from "@/db/schema";

import { LeagueSourceForm } from "./league-source-form";

export default async function AdminLeagueSourceFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = await db.select().from(teams).orderBy(teams.name);

  if (id === "new") {
    return <LeagueSourceForm mode="create" teamOptions={teamOptions} />;
  }

  const sourceId = Number(id);
  const [source] = await db.select().from(leagueSources).where(eq(leagueSources.id, sourceId));
  if (!source) notFound();

  return <LeagueSourceForm mode="edit" source={source} teamOptions={teamOptions} />;
}
