import "server-only";
import { cache } from "react";
import { and, eq, gt, gte, inArray, or } from "drizzle-orm";

import { db } from "@/db/client";
import { games as gamesTable, leagueSources, teams as teamsTable } from "@/db/schema";
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

export type HeaderMatch = { home: Team; away: Team; label: string; date: string; time: string; venue: string };

export const getNextMatch = cache(async function getNextMatch(): Promise<HeaderMatch | null> {
  try {
    const now = new Date();
    const today = toDateKey(now);
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Riga", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(now);
    const [game] = await db.select({
      home: gamesTable.homeTeam, away: gamesTable.awayTeam,
      date: gamesTable.date, time: gamesTable.startTime, team: teamsTable.name, venue: gamesTable.location,
    }).from(gamesTable).innerJoin(teamsTable, eq(gamesTable.teamId, teamsTable.id))
      .where(or(gt(gamesTable.date, today), and(eq(gamesTable.date, today), gte(gamesTable.startTime, time))))
      .orderBy(gamesTable.date, gamesTable.startTime).limit(1);
    if (!game) return null;
    const [, month, day] = game.date.split("-");
    const displayDate = `${Number(day)}. ${["jan", "feb", "mar", "apr", "mai", "jūn", "jūl", "aug", "sep", "okt", "nov", "dec"][Number(month) - 1]}`;
    const logos = await resolveClubLogos([game.home, game.away]);
    return {
      home: teamDisplay(game.home, logos.get(game.home) ?? null),
      away: teamDisplay(game.away, logos.get(game.away) ?? null),
      date: displayDate,
      time: game.time,
      venue: game.venue,
      label: `${game.home} – ${game.away} (${game.team}) · ${day}.${month}. ${game.time}`,
    };
  } catch {
    return null;
  }
});

/** The club's own upcoming games, pulled straight from the `games` DB table.
 *  Shared by the homepage showcase and the article "Nākamā spēle" widget so
 *  both stay in sync with the same real data. Server-only: never import this
 *  from a "use client" component — it touches the DB client. */
export const getUpcomingGamesFromDb = cache(async function getUpcomingGamesFromDb(
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
});

export type GameListItem = UpcomingGame & {
  endTime?: string;
  fixturesUrl?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  /** Which of the club's own teams plays this fixture (e.g. "U14", "Sieviešu 1"). */
  teamName: string;
  /** "YYYY-MM-DD" — used for calendar-grid placement. */
  rawDate: string;
  isPast: boolean;
};

/** Every game on file — upcoming and past — for the public /speles listing.
 *  Server-only: never import this from a "use client" component. */
export const getAllGamesFromDb = cache(async function getAllGamesFromDb(): Promise<GameListItem[]> {
  try {
    const todayKey = toDateKey(new Date());
    const rows = await db
      .select({
        id: gamesTable.id,
        teamId: gamesTable.teamId,
        homeTeam: gamesTable.homeTeam,
        awayTeam: gamesTable.awayTeam,
        homeScore: gamesTable.homeScore,
        awayScore: gamesTable.awayScore,
        date: gamesTable.date,
        startTime: gamesTable.startTime,
        endTime: gamesTable.endTime,
        location: gamesTable.location,
        league: gamesTable.league,
        teamName: teamsTable.name,
      })
      .from(gamesTable)
      .innerJoin(teamsTable, eq(gamesTable.teamId, teamsTable.id))
      .orderBy(gamesTable.date, gamesTable.startTime);

    const [logos, sources] = await Promise.all([
      resolveClubLogos(rows.flatMap((row) => [row.homeTeam, row.awayTeam])),
      rows.length > 0 ? db.select({ teamId: leagueSources.teamId, label: leagueSources.label, url: leagueSources.url }).from(leagueSources).where(inArray(leagueSources.teamId, [...new Set(rows.map((row) => row.teamId))])) : Promise.resolve([]),
    ]);

    return rows.map((row) => {
      const [year, month, day] = row.date.split("-").map(Number);
      const teamSources = sources.filter((source) => source.teamId === row.teamId);
      const source = teamSources.find((source) => source.label === row.league) ?? (teamSources.length === 1 ? teamSources[0] : undefined);
      return {
        id: row.id,
        day: String(day).padStart(2, "0"),
        month: MONTHS[month - 1] ?? "",
        year: String(year),
        weekday: weekdayAbbrFor(row.date),
        time: row.startTime,
        endTime: row.endTime,
        fixturesUrl: source?.url ?? null,
        homeScore: row.homeScore,
        awayScore: row.awayScore,
        league: row.league ?? "Draudzības spēle",
        home: teamDisplay(row.homeTeam, logos.get(row.homeTeam) ?? null),
        away: teamDisplay(row.awayTeam, logos.get(row.awayTeam) ?? null),
        venue: row.location,
        teamName: row.teamName,
        rawDate: row.date,
        isPast: row.date < todayKey,
      };
    });
  } catch {
    return [];
  }
});
