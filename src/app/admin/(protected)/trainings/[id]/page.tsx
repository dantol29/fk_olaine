import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { teams, trainings } from "@/db/schema";

import { TrainingForm } from "./training-form";

export default async function AdminTrainingFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = await db.select().from(teams).orderBy(teams.name);

  if (id === "new") {
    return <TrainingForm mode="create" teamOptions={teamOptions} />;
  }

  const trainingId = Number(id);
  const [training] = await db.select().from(trainings).where(eq(trainings.id, trainingId));
  if (!training) notFound();

  return <TrainingForm mode="edit" training={training} teamOptions={teamOptions} />;
}
