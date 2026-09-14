import { getLeagueStandingsForDisplay } from "@/lib/league-standings-server";
import { HomeNewsCarousel } from "@/components/home-news-carousel";
import { LeagueSelector } from "@/components/league-selector";
import { WideScreenFillers } from "@/components/wide-screen-fillers";

export async function Hero() {
  const leagues = await getLeagueStandingsForDisplay();

  return (
    <section className="px-6 pt-2 pb-3 sm:pt-3">
      <div className="relative mx-auto max-w-[1440px]">
        <WideScreenFillers />

        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-0">
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
