import { notFound } from "next/navigation";

import { WeekCalendar } from "@/components/week-calendar";
import { db } from "@/db/client";
import { coaches, teams, trainingLocations } from "@/db/schema";
import { getScheduleForWeekBrowsing, type CalendarEvent } from "@/lib/calendar";

import { TrainingForm } from "./training-form";

export default async function AdminTrainingFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [teamOptions, coachOptions, locations] = await Promise.all([
    db.select().from(teams).orderBy(teams.sort, teams.name),
    db.select({ id: coaches.id, name: coaches.name }).from(coaches).orderBy(coaches.name),
    db.select({ name: trainingLocations.name }).from(trainingLocations).orderBy(trainingLocations.name),
  ]);

  let training = null;
  if (id !== "new") {
    const trainingId = Number(id);
    training = await db.query.trainings.findFirst({
      where: (trainings, { eq }) => eq(trainings.id, trainingId),
      with: { trainingTeams: true, trainingCoaches: true },
    });
    if (!training) notFound();
  }

  const locationOptions = [...new Set(["Olaines pilsētas stadions", ...locations.map((item) => item.name), ...(training ? [training.location] : [])])];

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
          locationOptions={locationOptions}
        />
      ) : (
        <TrainingForm mode="create" teamOptions={teamOptions} coachOptions={coachOptions} locationOptions={locationOptions} />
      )}

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-black">
          Esošais grafiks (lai zinātu, kas jau ir aizņemts)
        </h2>
        <WeekCalendar events={events} teamOrder={teamOptions.map((team) => team.name)} />
      </div>
    </div>
  );
}
