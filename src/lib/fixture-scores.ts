import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { games } from "@/db/schema";
import type { ScrapedFixture } from "@/lib/fixtures";

/** Update known LFF results without changing manually entered games or
 * erasing a result when the source temporarily has no score. */
export async function updateFixtureScores(teamId: number, sourceId: number, fixtures: ScrapedFixture[]) {
  const existing = await db.select().from(games).where(and(
    eq(games.teamId, teamId), eq(games.source, "lff"),
    eq(games.leagueSourceId, sourceId),
  ));
  const byMatch = new Map(existing.map((game) => [`${game.date}|${game.homeTeam}|${game.awayTeam}`, game]));
  let updated = 0;
  for (const fixture of fixtures) {
    if (fixture.homeScore === null || fixture.awayScore === null) continue;
    const game = byMatch.get(`${fixture.date}|${fixture.home}|${fixture.away}`);
    if (!game || (game.homeScore === fixture.homeScore && game.awayScore === fixture.awayScore)) continue;
    await db.update(games).set({ homeScore: fixture.homeScore, awayScore: fixture.awayScore }).where(eq(games.id, game.id));
    updated++;
  }
  return updated;
}
