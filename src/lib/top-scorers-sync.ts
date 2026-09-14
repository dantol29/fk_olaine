import "server-only";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { playerTeams } from "@/db/schema";
import { getTopScorers } from "@/lib/top-scorers";

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase("lv");
}

export type TopScorerSyncDetail = {
  name: string;
  club: string;
  goals: number;
  matchedPlayerId: number | null;
  previousGoals: number | null;
};

export type TopScorerSyncResult = {
  updated: number;
  unmatched: string[];
  details: TopScorerSyncDetail[];
  error?: string;
};

/** Fetches one league source's goal-scorers page and, for every scraped row
 *  whose club matches FK Olaine, updates that source's team's matching
 *  player's `goals` count by exact (case-insensitive) name match. Never
 *  creates players, never touches photos or any other field — a name that
 *  doesn't match an existing player on the team is just reported back,
 *  not inserted. `details` carries the full per-row breakdown for the admin
 *  preview page; `unmatched` is the same data flattened to names only, kept
 *  for the cron job's plain-text summary. */
export async function syncTopScorersForSource(source: {
  teamId: number;
  topScorersUrl: string;
}): Promise<TopScorerSyncResult> {
  let scorers;
  try {
    scorers = await getTopScorers(source.topScorersUrl);
  } catch (error) {
    return { updated: 0, unmatched: [], details: [], error: (error as Error).message };
  }

  const olaineScorers = scorers.filter((scorer) => scorer.isOlaine);
  if (olaineScorers.length === 0) {
    return { updated: 0, unmatched: [], details: [] };
  }

  const teamPlayers = await db.query.playerTeams.findMany({
    where: eq(playerTeams.teamId, source.teamId),
    with: { player: true },
  });
  const rowsByName = new Map(
    teamPlayers
      .filter((pt) => pt.player !== null)
      .map((pt) => [normalizeName(pt.player!.name), pt]),
  );

  let updated = 0;
  const unmatched: string[] = [];
  const details: TopScorerSyncDetail[] = [];
  for (const scorer of olaineScorers) {
    const match = rowsByName.get(normalizeName(scorer.name));
    if (!match) {
      unmatched.push(scorer.name);
      details.push({
        name: scorer.name,
        club: scorer.club,
        goals: scorer.goals,
        matchedPlayerId: null,
        previousGoals: null,
      });
      continue;
    }
    const previousGoals = match.goals;
    if (match.goals !== scorer.goals) {
      await db
        .update(playerTeams)
        .set({ goals: scorer.goals })
        .where(and(eq(playerTeams.playerId, match.playerId), eq(playerTeams.teamId, source.teamId)));
      updated++;
    }
    details.push({
      name: scorer.name,
      club: scorer.club,
      goals: scorer.goals,
      matchedPlayerId: match.playerId,
      previousGoals,
    });
  }

  return { updated, unmatched, details };
}
