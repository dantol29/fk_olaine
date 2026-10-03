import { getLeagueStandingsForDisplay } from "@/lib/league-standings-server";
import { HomeNewsCarousel } from "@/components/home-news-carousel";
import { LeagueSelector } from "@/components/league-selector";
import { SiteHeader } from "@/components/site-header";

const SHOW_LEAGUE_TABLE = false;

export async function Hero() {
  const leagues = SHOW_LEAGUE_TABLE ? await getLeagueStandingsForDisplay() : [];

  return (
    <section aria-label="Kluba jaunumi" className="relative bg-club-navy">
      <div className="home-hero-stage relative">
        <SiteHeader overlay />
        <div className="home-hero-frame home-page-hero-frame flex min-w-0 flex-col">
          <HomeNewsCarousel embedded featured className="flex-1" />
        </div>
      </div>
      {SHOW_LEAGUE_TABLE && (
        <aside aria-label="Turnīra tabula" className="home-hero-table mx-auto w-full max-w-[900px] px-5 py-8 sm:px-8">
          <LeagueSelector leagues={leagues} hero />
        </aside>
      )}
    </section>
  );
}
