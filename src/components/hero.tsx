import { getUpcomingGamesFromDb } from "@/lib/games-server";
import type { UpcomingGame } from "@/lib/games";
import { getLeagueStandingsForDisplay } from "@/lib/league-standings-server";
import { HomeNewsCarousel } from "@/components/home-news-carousel";
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

        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-0">
          {/* Left column: matches showcase — hidden per request, kept mounted
           *  (not removed) so it's a one-line toggle to bring back. */}
          <div className="hidden">
            <MatchesShowcase games={upcomingGames} />
          </div>

          {/* News carousel takes the matches showcase's place for now. */}
          <div className="relative ml-[calc(50%-50vw)] flex h-[520px] w-screen flex-col rounded-[1.5rem] border border-slate-200 shadow-sm sm:ml-0 sm:h-auto sm:w-full lg:h-[640px] lg:overflow-hidden lg:rounded-r-none">
            <HomeNewsCarousel embedded className="lg:rounded-r-none" />
          </div>

          {/* League table card */}
          <div className="relative flex h-auto flex-col sm:rounded-[1.5rem] sm:border sm:border-slate-200 sm:shadow-sm lg:h-[640px] lg:overflow-hidden lg:rounded-l-none">
            <LeagueSelector leagues={leagues} flushLeft />
          </div>
        </div>
      </div>
    </section>
  );
}
