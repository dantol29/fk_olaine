import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { WeekCalendar } from "@/components/week-calendar";
import { db } from "@/db/client";
import { games, teams } from "@/db/schema";
import { getScheduleForWeekBrowsing, type CalendarEvent } from "@/lib/calendar";

import { GameForm } from "./game-form";

export default async function AdminGameFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = await db.select().from(teams).orderBy(teams.name);

  let game = null;
  if (id !== "new") {
    const gameId = Number(id);
    [game] = await db.select().from(games).where(eq(games.id, gameId));
    if (!game) notFound();
  }

  let events: CalendarEvent[] = [];
  try {
    events = await getScheduleForWeekBrowsing();
  } catch {
    events = [];
  }

  return (
    <div>
      {game ? (
        <GameForm mode="edit" game={game} teamOptions={teamOptions} />
      ) : (
        <GameForm mode="create" teamOptions={teamOptions} />
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
