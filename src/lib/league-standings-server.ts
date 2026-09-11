import "server-only";
import { isNotNull } from "drizzle-orm";

import { db } from "@/db/client";
import { leagueSources } from "@/db/schema";
import { backfillClubLogos } from "@/lib/club-logos";
import { getStandings, type StandingRow } from "@/lib/standings";

const FALLBACK_STANDINGS: StandingRow[] = [
  {
    pos: 1,
    team: "RFS Women",
    logo: null,
    played: 17,
    wins: 15,
    draws: 0,
    losses: 2,
    goalsFor: 98,
    goalsAgainst: 10,
    goalDiff: 88,
    points: 45,
    isOlaine: false,
  },
  {
    pos: 4,
    team: "FK Iecava/FK Olaine",
    logo: null,
    played: 17,
    wins: 7,
    draws: 0,
    losses: 10,
    goalsFor: 49,
    goalsAgainst: 55,
    goalDiff: -6,
    points: 21,
    isOlaine: true,
  },
];

export type LeagueStandings = { label: string; standings: StandingRow[]; url: string };

/** Every league source the admin has given a standings URL, live-fetched.
 *  Shared by the homepage hero and the /speles page so both stay in sync
 *  with the same real data. A per-source fetch failure just shows that one
 *  league empty (LeagueSelector already renders "Tabula pašlaik nav
 *  pieejama." for an empty list), not the whole page falling back. */
export async function getLeagueStandingsForDisplay(): Promise<LeagueStandings[]> {
  const fallback = [{ label: "Sieviešu līga", standings: FALLBACK_STANDINGS, url: "https://lff.lv/" }];

  try {
    const sources = await db
      .select({ label: leagueSources.label, standingsUrl: leagueSources.standingsUrl })
      .from(leagueSources)
      .where(isNotNull(leagueSources.standingsUrl))
      .orderBy(leagueSources.displayOrder, leagueSources.label);

    if (sources.length === 0) {
      return fallback;
    }

    const results = await Promise.all(
      sources.map(async (source) => {
        const url = source.standingsUrl as string;
        try {
          const standings = await getStandings(url);
          return { label: source.label, standings, url };
        } catch {
          return { label: source.label, standings: [], url };
        }
      }),
    );

    // Best-effort: also catch any club logo LFF has on file for a team
    // that only ever shows up in a standings table (not a fixtures list),
    // same idempotent backfill the fixtures import uses. A failure here
    // must never take down the standings themselves.
    try {
      const scrapedLogos = new Map<string, string>();
      for (const { standings } of results) {
        for (const row of standings) {
          if (row.logo) scrapedLogos.set(row.team, row.logo);
        }
      }
      await backfillClubLogos(scrapedLogos);
    } catch {
      // Ignore — logos will simply stay unresolved until the next successful run.
    }

    return results;
  } catch {
    return fallback;
  }
}
