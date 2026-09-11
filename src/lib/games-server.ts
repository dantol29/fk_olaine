import "server-only";
import { eq, gte } from "drizzle-orm";

import { db } from "@/db/client";
import { games as gamesTable, teams as teamsTable } from "@/db/schema";
import { toDateKey } from "@/lib/calendar";
import { resolveClubLogos } from "@/lib/club-logos";
import { colorFor, initialsFor, MONTHS, type Team, type UpcomingGame } from "@/lib/games";

function teamDisplay(name: string, logo: string | null): Team {
  return logo ? { name, logo } : { name, initials: initialsFor(name), color: colorFor(name) };
}

const WEEKDAY_ABBR: Record<string, string> = {
  pirmdiena: "PIRMD.",
  otrdiena: "OTRD.",
  trešdiena: "TREŠD.",
  ceturtdiena: "CETURTD.",
  piektdiena: "PIEKTD.",
  sestdiena: "SESTD.",
  svētdiena: "SVĒTD.",
};

function weekdayAbbrFor(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12));
  const weekday = new Intl.DateTimeFormat("lv-LV", {
    timeZone: "Europe/Riga",
    weekday: "long",
  })
    .format(noonUtc)
    .toLowerCase();
  return WEEKDAY_ABBR[weekday] ?? "";
}

/** The club's own upcoming games, pulled straight from the `games` DB table.
 *  Shared by the homepage showcase and the article "Nākamā spēle" widget so
 *  both stay in sync with the same real data. Server-only: never import this
 *  from a "use client" component — it touches the DB client. */
export async function getUpcomingGamesFromDb(
  limit: number,
): Promise<UpcomingGame[]> {
  try {
    const todayKey = toDateKey(new Date());
    const rows = await db
      .select()
      .from(gamesTable)
      .where(gte(gamesTable.date, todayKey))
      .orderBy(gamesTable.date, gamesTable.startTime)
      .limit(limit);

    const logos = await resolveClubLogos(rows.flatMap((row) => [row.homeTeam, row.awayTeam]));

    return rows.map((row) => {
      const [year, month, day] = row.date.split("-").map(Number);
      return {
        id: row.id,
        day: String(day).padStart(2, "0"),
        month: MONTHS[month - 1] ?? "",
        year: String(year),
        weekday: weekdayAbbrFor(row.date),
        time: row.startTime,
        league: row.league ?? "Draudzības spēle",
        home: teamDisplay(row.homeTeam, logos.get(row.homeTeam) ?? null),
        away: teamDisplay(row.awayTeam, logos.get(row.awayTeam) ?? null),
        venue: row.location,
      };
    });
  } catch {
    return [];
  }
}

export type GameListItem = UpcomingGame & {
  /** Which of the club's own teams plays this fixture (e.g. "U14", "Sieviešu 1"). */
  teamName: string;
  isPast: boolean;
};

/** Every game on file — upcoming and past — for the public /speles listing.
 *  Server-only: never import this from a "use client" component. */
export async function getAllGamesFromDb(): Promise<GameListItem[]> {
  try {
    const todayKey = toDateKey(new Date());
    const rows = await db
      .select({
        id: gamesTable.id,
        homeTeam: gamesTable.homeTeam,
        awayTeam: gamesTable.awayTeam,
        date: gamesTable.date,
        startTime: gamesTable.startTime,
        location: gamesTable.location,
        league: gamesTable.league,
        teamName: teamsTable.name,
      })
      .from(gamesTable)
      .innerJoin(teamsTable, eq(gamesTable.teamId, teamsTable.id))
      .orderBy(gamesTable.date, gamesTable.startTime);

    const logos = await resolveClubLogos(rows.flatMap((row) => [row.homeTeam, row.awayTeam]));

    return rows.map((row) => {
      const [year, month, day] = row.date.split("-").map(Number);
      return {
        id: row.id,
        day: String(day).padStart(2, "0"),
        month: MONTHS[month - 1] ?? "",
        year: String(year),
        weekday: weekdayAbbrFor(row.date),
        time: row.startTime,
        league: row.league ?? "Draudzības spēle",
        home: teamDisplay(row.homeTeam, logos.get(row.homeTeam) ?? null),
        away: teamDisplay(row.awayTeam, logos.get(row.awayTeam) ?? null),
        venue: row.location,
        teamName: row.teamName,
        isPast: row.date < todayKey,
      };
    });
  } catch {
    return [];
  }
}
