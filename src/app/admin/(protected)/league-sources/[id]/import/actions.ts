"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { games } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";

type SelectedFixture = {
  homeTeam: string;
  awayTeam: string;
  date: string;
  startTime: string;
  location: string;
};

type LffGameUpdate = {
  id: number;
  startTime: string;
  location: string;
};

function addMinutes(time: string, minutes: number): string {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  const wrappedHour = Math.floor(total / 60) % 24;
  const remMinute = total % 60;
  return `${String(wrappedHour).padStart(2, "0")}:${String(remMinute).padStart(2, "0")}`;
}

export async function confirmImport(teamId: number, league: string, formData: FormData) {
  await requireAdminSession();

  const selections = formData
    .getAll("selected")
    .map((value) => JSON.parse(String(value)) as SelectedFixture);

  if (selections.length > 0) {
    await db.insert(games).values(
      selections.map((fixture) => ({
        teamId,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        date: fixture.date,
        startTime: fixture.startTime,
        endTime: addMinutes(fixture.startTime, 90),
        location: fixture.location,
        source: "lff" as const,
        league,
        createdAt: Date.now(),
      })),
    );
  }

  revalidatePath("/admin/games");
  revalidatePath("/");
  redirect("/admin/games");
}

/** Overwrites the local start time/location for already-imported games with
 *  whatever LFF currently shows for them — for the rows the import screen
 *  flagged as "dati atšķiras". Only ever touches games the admin explicitly
 *  submitted (built from the diff shown on that screen), never inserts or
 *  deletes anything. */
export async function applyLffChanges(sourceId: number, formData: FormData) {
  await requireAdminSession();

  const updates = JSON.parse(String(formData.get("updates") ?? "[]")) as LffGameUpdate[];

  for (const update of updates) {
    await db
      .update(games)
      .set({
        startTime: update.startTime,
        endTime: addMinutes(update.startTime, 90),
        location: update.location,
      })
      .where(eq(games.id, update.id));
  }

  revalidatePath("/admin/games");
  revalidatePath("/");
  redirect(`/admin/league-sources/${sourceId}/import`);
}
