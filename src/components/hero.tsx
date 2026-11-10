import { getLeagueStandingsForDisplay } from "@/lib/league-standings-server";
import { HomeSlideshow } from "@/components/home-slideshow";
import { getHomeSlides } from "@/lib/home-slides";
import { connection } from "next/server";
import { LeagueSelector } from "@/components/league-selector";
import { SiteHeader } from "@/components/site-header";

const SHOW_LEAGUE_TABLE = false;

export async function Hero() {
  await connection();
  const slides = await getHomeSlides();
  const leagues = SHOW_LEAGUE_TABLE ? await getLeagueStandingsForDisplay() : [];

  return (
    <section aria-label="FK Olaine attēli" className="relative bg-club-navy">
      <div className="home-hero-stage relative">
        <SiteHeader overlay />
        <div className="home-hero-frame home-page-hero-frame flex min-w-0 flex-col">
          <HomeSlideshow slides={slides} />
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
