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

async function fetchStandings(
  competition: Parameters<typeof getStandings>[0],
  fallback: StandingRow[] = [],
): Promise<StandingRow[]> {
  try {
    return await getStandings(competition);
  } catch {
    return fallback;
  }
}

async function fetchUpcomingGames(): Promise<UpcomingGame[]> {
  const rows = await getUpcomingGamesFromDb(5);
  return rows.length > 0 ? rows : FALLBACK_UPCOMING_GAMES;
}

export async function Hero() {
  const [sieviesuLiga, liga1, u16, upcomingGames] = await Promise.all([
    fetchStandings("sieviesu-liga", FALLBACK_STANDINGS),
    fetchStandings("1-liga"),
    fetchStandings("u16"),
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
          <div className="relative flex h-[640px] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-background shadow-sm">
            <LeagueSelector leagues={[sieviesuLiga, liga1, u16]} />
          </div>
        </div>
      </div>
    </section>
  );
}
