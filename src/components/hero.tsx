import { isNotNull } from "drizzle-orm";

import { db } from "@/db/client";
import { leagueSources } from "@/db/schema";
import { getStandings, type StandingRow } from "@/lib/standings";
import { getUpcomingGamesFromDb } from "@/lib/games-server";
import type { UpcomingGame } from "@/lib/games";
import { LeagueSelector } from "@/components/league-selector";
import { MatchesShowcase } from "@/components/matches-showcase";
import { WideScreenFillers } from "@/components/wide-screen-fillers";

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

const FALLBACK_UPCOMING_GAMES: UpcomingGame[] = [
  {
    id: -1,
    day: "07",
    month: "SEP",
    year: "2026",
    weekday: "PIRMD.",
    time: "16:00",
    home: { name: "FK Olaine", logo: "/fk-olaine-crest-v2.png" },
    away: { name: "RFS Women", initials: "RFS", color: "bg-[#173f8a]" },
    venue: "RFS stadions",
    league: "Sieviešu līga",
  },
  {
    id: -2,
    day: "14",
    month: "SEP",
    year: "2026",
    weekday: "PIRMD.",
    time: "14:00",
    home: { name: "Liepājas FS", initials: "LFS", color: "bg-[#167c4c]" },
    away: { name: "FK Olaine", logo: "/fk-olaine-crest-v2.png" },
    venue: "Liepājas stadions",
    league: "Sieviešu līga",
  },
  {
    id: -3,
    day: "21",
    month: "SEP",
    year: "2026",
    weekday: "PIRMD.",
    time: "15:00",
    home: { name: "FK Olaine", logo: "/fk-olaine-crest-v2.png" },
    away: {
      name: "Riga FC Women",
      initials: "RFC",
      color: "bg-[#1687c9]",
    },
    venue: "Olaines stadions",
    league: "Sieviešu līga",
  },
];

/** Every league source the admin has given a standings URL, live-fetched.
 *  Falls back to a single placeholder league only when none are configured
 *  yet — a per-source fetch failure just shows that one league empty
 *  (LeagueSelector already renders "Tabula pašlaik nav pieejama." for an
 *  empty list), not the whole homepage falling back. */
async function fetchLeagueStandings(): Promise<
  { label: string; standings: StandingRow[]; url: string }[]
> {
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

    return await Promise.all(
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
  } catch {
    return fallback;
  }
}

async function fetchUpcomingGames(): Promise<UpcomingGame[]> {
  const rows = await getUpcomingGamesFromDb(5);
  return rows.length > 0 ? rows : FALLBACK_UPCOMING_GAMES;
}

export async function Hero() {
  const [leagues, upcomingGames] = await Promise.all([
    fetchLeagueStandings(),
    fetchUpcomingGames(),
  ]);

  return (
    <section className="px-6 pt-2 pb-3 sm:pt-3">
      <div className="relative mx-auto max-w-[1440px]">
        <WideScreenFillers />

        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Left column: full-height matches showcase */}
          <MatchesShowcase games={upcomingGames} />

          {/* League table card */}
          <div className="relative flex h-[760px] flex-col overflow-hidden sm:h-[640px] sm:rounded-[2rem] sm:border sm:border-slate-200 sm:bg-background sm:shadow-sm">
            <LeagueSelector leagues={leagues} />
          </div>
        </div>
      </div>
    </section>
  );
}
