import "server-only";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { teams as teamsTable, trainings as trainingsTable } from "@/db/schema";
import { toDateKey } from "@/lib/calendar";
import { MONTHS } from "@/lib/games";

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
  isPast: boolean;
};

/** Every training session on file, for the public /treninji listing.
 *  Server-only: never import this from a "use client" component. */
export async function getAllTrainingsFromDb(): Promise<TrainingListItem[]> {
  try {
    const todayKey = toDateKey(new Date());
    const rows = await db
      .select({
        id: trainingsTable.id,
        date: trainingsTable.date,
        startTime: trainingsTable.startTime,
        endTime: trainingsTable.endTime,
        location: trainingsTable.location,
        teamName: teamsTable.name,
      })
      .from(trainingsTable)
      .innerJoin(teamsTable, eq(trainingsTable.teamId, teamsTable.id))
      .orderBy(trainingsTable.date, trainingsTable.startTime);

    return rows.map((row) => {
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
        teamName: row.teamName,
        isPast: row.date < todayKey,
      };
    });
  } catch {
    return [];
  }
}
