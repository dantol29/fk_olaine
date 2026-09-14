import "server-only";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { games } from "@/db/schema";
import { backfillClubLogos } from "@/lib/club-logos";
import { scrapeFixtures } from "@/lib/fixtures";
import { isOlaine } from "@/lib/games";

function addMinutes(time: string, minutes: number): string {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  const wrappedHour = Math.floor(total / 60) % 24;
  const remMinute = total % 60;
  return `${String(wrappedHour).padStart(2, "0")}:${String(remMinute).padStart(2, "0")}`;
}

export type ReviewNeededGame = {
  date: string;
  homeTeam: string;
  awayTeam: string;
  oldStartTime: string;
  newStartTime: string;
  oldLocation: string;
  newLocation: string;
};

/** Fetches one league source's fixtures, backfills any club logos LFF has
 *  on file, and inserts every not-yet-imported FK Olaine fixture straight
 *  into `games` — no admin review step. This is what the scheduled cron
 *  sync calls for every league source; the manual "Ielādēt spēles" review
 *  screen has its own confirm-based flow and doesn't use this.
 *
 *  Also *detects* (never applies) drift on games that already exist: if
 *  LFF now shows a different time/venue for one than what's saved locally,
 *  it's reported back in `reviewNeeded` — same diff the "Ielādēt spēles"
 *  screen already surfaces, applied there via its own explicit button. */
export async function syncLeagueSource(source: {
  teamId: number;
  label: string;
  url: string;
}): Promise<{ imported: number; reviewNeeded: ReviewNeededGame[]; error?: string }> {
  let fixtures;
  try {
    fixtures = await scrapeFixtures(source.url);
  } catch (error) {
    return { imported: 0, reviewNeeded: [], error: (error as Error).message };
  }

  const candidates = fixtures.filter(
    (fixture) => fixture.time !== null && (isOlaine(fixture.home) || isOlaine(fixture.away)),
  );
  if (candidates.length === 0) {
    return {
      imported: 0,
      reviewNeeded: [],
      error: `LFF returned ${fixtures.length} fixtures, but none with a valid time matched FK Olaine`,
    };
  }

  const scrapedLogos = new Map<string, string>();
  for (const fixture of candidates) {
    if (fixture.homeLogo) scrapedLogos.set(fixture.home, fixture.homeLogo);
    if (fixture.awayLogo) scrapedLogos.set(fixture.away, fixture.awayLogo);
  }
  await backfillClubLogos(scrapedLogos);

  const existingGames = await db
    .select({
      date: games.date,
      homeTeam: games.homeTeam,
      awayTeam: games.awayTeam,
      startTime: games.startTime,
      location: games.location,
    })
    .from(games)
    .where(and(eq(games.teamId, source.teamId), eq(games.source, "lff")));
  const existingByKey = new Map(
    existingGames.map((g) => [`${g.date}|${g.homeTeam}|${g.awayTeam}`, g]),
  );

  const newFixtures = candidates.filter(
    (fixture) => !existingByKey.has(`${fixture.date}|${fixture.home}|${fixture.away}`),
  );

  if (newFixtures.length > 0) {
    await db.insert(games).values(
      newFixtures.map((fixture) => {
        const startTime = fixture.time as string; // guaranteed by the candidates filter above
        return {
          teamId: source.teamId,
          homeTeam: fixture.home,
          awayTeam: fixture.away,
          date: fixture.date,
          startTime,
          endTime: addMinutes(startTime, 90),
          location: fixture.stadium || "Nav norādīts",
          source: "lff" as const,
          league: source.label,
          createdAt: Date.now(),
        };
      }),
    );
  }

  const reviewNeeded: ReviewNeededGame[] = [];
  for (const fixture of candidates) {
    const existing = existingByKey.get(`${fixture.date}|${fixture.home}|${fixture.away}`);
    if (!existing) continue;
    const newLocation = fixture.stadium || "Nav norādīts";
    if (existing.startTime === fixture.time && existing.location === newLocation) continue;
    reviewNeeded.push({
      date: fixture.date,
      homeTeam: fixture.home,
      awayTeam: fixture.away,
      oldStartTime: existing.startTime,
      newStartTime: fixture.time as string,
      oldLocation: existing.location,
      newLocation,
    });
  }

  return { imported: newFixtures.length, reviewNeeded };
}
