import "server-only";
import { cache } from "react";
import { db } from "@/db/client";
import { toDateKey } from "@/lib/calendar";
import { MONTHS } from "@/lib/games";

export type TrainingCoach = { name: string; photoUrl: string | null };

export type TrainingListItem = {
  id: number;
  day: string;
  month: string;
  year: string;
  rawDate: string;
  startTime: string;
  endTime: string;
  location: string;
  teamName: string;
  teamNames: string[];
  coaches: TrainingCoach[];
  isPast: boolean;
};

/** Every training session on file, for the public /treninji listing.
 *  Server-only: never import this from a "use client" component. */
export const getAllTrainingsFromDb = cache(async function getAllTrainingsFromDb(): Promise<TrainingListItem[]> {
  try {
    const todayKey = toDateKey(new Date());
    const rows = await db.query.trainings.findMany({
      with: { trainingTeams: { with: { team: true } }, trainingCoaches: { with: { coach: true } } },
      orderBy: (table, { asc }) => [asc(table.date), asc(table.startTime)],
    });

    return rows.map((row) => {
      const teamNames = row.trainingTeams.slice().sort((a, b) => a.team.sort - b.team.sort || a.team.name.localeCompare(b.team.name, "lv")).map(({ team }) => team.name);
      const [year, month, day] = row.date.split("-").map(Number);
      return {
        id: row.id,
        day: String(day).padStart(2, "0"),
        month: MONTHS[month - 1] ?? "",
        year: String(year),
        rawDate: row.date,
        startTime: row.startTime,
        endTime: row.endTime,
        location: row.location,
        teamName: teamNames.join(", "),
        teamNames,
        coaches: row.trainingCoaches.map(({ coach }) => ({ name: coach.name, photoUrl: coach.photoUrl })),
        isPast: row.date < todayKey,
      };
    });
  } catch {
    return [];
  }
});
