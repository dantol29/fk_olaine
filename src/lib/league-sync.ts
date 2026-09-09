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

/** Fetches one league source's fixtures, backfills any club logos LFF has
 *  on file, and inserts every not-yet-imported FK Olaine fixture straight
 *  into `games` — no admin review step. This is what the scheduled cron
 *  sync calls for every league source; the manual "Ielādēt spēles" review
 *  screen has its own confirm-based flow and doesn't use this. */
export async function syncLeagueSource(source: {
  teamId: number;
  label: string;
  url: string;
}): Promise<{ imported: number; error?: string }> {
  let fixtures;
  try {
    fixtures = await scrapeFixtures(source.url);
  } catch (error) {
    return { imported: 0, error: (error as Error).message };
  }

  const candidates = fixtures.filter(
    (fixture) => fixture.time !== null && (isOlaine(fixture.home) || isOlaine(fixture.away)),
  );

  const scrapedLogos = new Map<string, string>();
  for (const fixture of candidates) {
    if (fixture.homeLogo) scrapedLogos.set(fixture.home, fixture.homeLogo);
    if (fixture.awayLogo) scrapedLogos.set(fixture.away, fixture.awayLogo);
  }
  await backfillClubLogos(scrapedLogos);

  const existingGames = await db
    .select({ date: games.date, homeTeam: games.homeTeam, awayTeam: games.awayTeam })
    .from(games)
    .where(and(eq(games.teamId, source.teamId), eq(games.source, "lff")));
  const existingKeys = new Set(existingGames.map((g) => `${g.date}|${g.homeTeam}|${g.awayTeam}`));

  const newFixtures = candidates.filter(
    (fixture) => !existingKeys.has(`${fixture.date}|${fixture.home}|${fixture.away}`),
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

  return { imported: newFixtures.length };
}
