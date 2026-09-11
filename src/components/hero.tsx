import { getUpcomingGamesFromDb } from "@/lib/games-server";
import type { UpcomingGame } from "@/lib/games";
import { getLeagueStandingsForDisplay } from "@/lib/league-standings-server";
import { LeagueSelector } from "@/components/league-selector";
import { MatchesShowcase } from "@/components/matches-showcase";
import { WideScreenFillers } from "@/components/wide-screen-fillers";

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

async function fetchUpcomingGames(): Promise<UpcomingGame[]> {
  const rows = await getUpcomingGamesFromDb(5);
  return rows.length > 0 ? rows : FALLBACK_UPCOMING_GAMES;
}

export async function Hero() {
  const [leagues, upcomingGames] = await Promise.all([
    getLeagueStandingsForDisplay(),
    fetchUpcomingGames(),
  ]);

  return (
    <section className="px-6 pt-2 pb-3 sm:pt-3">
      <div className="relative mx-auto max-w-[1440px]">
        <WideScreenFillers />

        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Left column: full-height matches showcase */}
          <MatchesShowcase games={upcomingGames} />

          {/* League table card */}
          <div className="relative flex h-auto flex-col lg:h-[640px] lg:overflow-hidden">
            <LeagueSelector leagues={leagues} />
          </div>
        </div>
      </div>
    </section>
  );
}
