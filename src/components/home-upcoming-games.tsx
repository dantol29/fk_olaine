import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { getLeagueLogosForDisplay } from "@/lib/league-standings-server";
import { getAllGamesFromDb } from "@/lib/games-server";
import { UpcomingMatches } from "@/components/upcoming-matches";

export async function HomeUpcomingGames() {
  const [games, leagues] = await Promise.all([getAllGamesFromDb(), getLeagueLogosForDisplay()]);
  const next = games.filter((game) => !game.isPast).sort((a, b) => a.rawDate.localeCompare(b.rawDate) || a.time.localeCompare(b.time))[0];
  return <section className="bg-white px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
    {next ? <UpcomingMatches games={[next]} leagues={leagues} showFixtures={false} /> : (
      <div className="mx-auto max-w-[1280px] border border-black/15 bg-[#fafafa] px-6 py-12 text-center sm:py-16">
        <CalendarDays className="mx-auto mb-5 size-10 text-black/30" aria-hidden="true" />
        <h2 className="text-xl font-semibold">Gaidāmo spēļu pašlaik nav</h2>
        <p className="mt-3 text-sm text-black/55">Nākamo spēļu grafiks tiks papildināts. Iepriekšējo spēļu rezultātus vari apskatīt spēļu sadaļā.</p>
      </div>
    )}
    <div className="mt-6 flex justify-center">
      <Link href="/speles" className="motion-action flex min-h-11 items-center gap-3 border-2 border-black px-5 text-sm font-semibold text-black uppercase hover:bg-black hover:text-white focus-visible:outline-black">Visas spēles<ArrowRight className="action-arrow size-4" aria-hidden="true" /></Link>
    </div>
  </section>;
}
