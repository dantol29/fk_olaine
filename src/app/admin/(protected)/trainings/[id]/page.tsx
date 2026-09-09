import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { WeekCalendar } from "@/components/week-calendar";
import { db } from "@/db/client";
import { teams, trainings } from "@/db/schema";
import { getScheduleForWeekBrowsing, type CalendarEvent } from "@/lib/calendar";

import { TrainingForm } from "./training-form";

export default async function AdminTrainingFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = await db.select().from(teams).orderBy(teams.name);

  let training = null;
  if (id !== "new") {
    const trainingId = Number(id);
    [training] = await db.select().from(trainings).where(eq(trainings.id, trainingId));
    if (!training) notFound();
  }

  let events: CalendarEvent[] = [];
  try {
    events = await getScheduleForWeekBrowsing();
  } catch {
    events = [];
  }

  return (
    <div>
      {training ? (
        <TrainingForm mode="edit" training={training} teamOptions={teamOptions} />
      ) : (
        <TrainingForm mode="create" teamOptions={teamOptions} />
      )}

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-club-navy">
          Esošais grafiks (lai zinātu, kas jau ir aizņemts)
        </h2>
        <WeekCalendar events={events} />
      </div>
    </div>
  );
}
