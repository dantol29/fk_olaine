import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { WeekCalendar } from "@/components/week-calendar";
import { db } from "@/db/client";
import { games, leagueSources, teams } from "@/db/schema";
import { getScheduleForWeekBrowsing, type CalendarEvent } from "@/lib/calendar";

import { GameForm } from "./game-form";

export default async function AdminGameFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = await db.select().from(teams).orderBy(teams.name);

  const leagueOptions = await db.select().from(leagueSources).orderBy(leagueSources.label);

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
        <GameForm mode="edit" game={game} teamOptions={teamOptions} leagueOptions={leagueOptions} />
      ) : (
        <GameForm mode="create" teamOptions={teamOptions} leagueOptions={leagueOptions} />
      )}

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-black">
          Esošais grafiks (lai zinātu, kas jau ir aizņemts)
        </h2>
        <WeekCalendar events={events} />
      </div>
    </div>
  );
}
