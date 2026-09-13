import { notFound } from "next/navigation";

import { WeekCalendar } from "@/components/week-calendar";
import { db } from "@/db/client";
import { coaches, teams } from "@/db/schema";
import { getScheduleForWeekBrowsing, type CalendarEvent } from "@/lib/calendar";

import { TrainingForm } from "./training-form";

export default async function AdminTrainingFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [teamOptions, coachOptions] = await Promise.all([
    db.select().from(teams).orderBy(teams.name),
    db.select({ id: coaches.id, name: coaches.name }).from(coaches).orderBy(coaches.name),
  ]);

  let training = null;
  if (id !== "new") {
    const trainingId = Number(id);
    training = await db.query.trainings.findFirst({
      where: (trainings, { eq }) => eq(trainings.id, trainingId),
      with: { trainingCoaches: true },
    });
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
        <TrainingForm
          mode="edit"
          training={training}
          teamOptions={teamOptions}
          coachOptions={coachOptions}
        />
      ) : (
        <TrainingForm mode="create" teamOptions={teamOptions} coachOptions={coachOptions} />
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
