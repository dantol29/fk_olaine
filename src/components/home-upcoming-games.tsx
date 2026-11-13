import Image from "next/image";
import { getLeagueLogosForDisplay } from "@/lib/league-standings-server";
import { getAllGamesFromDb } from "@/lib/games-server";
import { UpcomingMatches } from "@/components/upcoming-matches";

export async function HomeUpcomingGames() {
  const [games, leagues] = await Promise.all([getAllGamesFromDb(), getLeagueLogosForDisplay()]);
  const next = games.filter((game) => !game.isPast).sort((a, b) => a.rawDate.localeCompare(b.rawDate) || a.time.localeCompare(b.time))[0];
  return <section className="relative z-10 -mt-14 bg-transparent sm:mt-0 sm:pt-16 lg:pt-0">
    {next ? <UpcomingMatches games={[next]} leagues={leagues} showFixtures={false} /> : (
      <div className="mx-auto max-w-[1280px] 2xl:max-w-[1600px]">
        <section aria-labelledby="empty-match-heading" className="relative overflow-hidden rounded-3xl bg-club-navy px-5 pt-6 text-white shadow-[0_-6px_24px_rgba(11,22,38,0.16)] sm:px-8 sm:shadow-none">
          <div aria-hidden="true" className="home-match-background" />
          <div className="relative">
            <h2 id="empty-match-heading" className="sr-only">Nākamā spēle</h2>
            <div className="flex min-h-[240px] flex-col items-center justify-center px-2 pb-10 text-center sm:min-h-[300px] sm:pb-16">
              <Image src="/fk-olaine-crest-v2.png" alt="FK Olaine" width={80} height={80} className="size-16 object-contain sm:size-20" />
              <p className="mt-6 text-xl font-semibold uppercase sm:text-2xl">Gaidāmo spēļu pašlaik nav</p>
              <p className="mt-3 max-w-md text-sm text-white/80 sm:text-base">Nākamo spēļu grafiks tiks papildināts.</p>
            </div>
          </div>
        </section>
      </div>
    )}
  </section>;
}
