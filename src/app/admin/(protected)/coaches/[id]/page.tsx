import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { teams } from "@/db/schema";

import { CoachForm } from "./coach-form";

export default async function AdminCoachFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = await db.select().from(teams).orderBy(teams.name);

  if (id === "new") {
    return <CoachForm mode="create" teamOptions={teamOptions} />;
  }

  const coachId = Number(id);
  const coach = await db.query.coaches.findFirst({
    where: (coaches, { eq }) => eq(coaches.id, coachId),
    with: { coachTeams: true },
  });
  if (!coach) notFound();

  return <CoachForm mode="edit" coach={coach} teamOptions={teamOptions} />;
}
