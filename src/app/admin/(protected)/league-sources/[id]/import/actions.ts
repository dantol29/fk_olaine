"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { games } from "@/db/schema";

type SelectedFixture = {
  homeTeam: string;
  awayTeam: string;
  date: string;
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
  redirect("/admin/games");
}
