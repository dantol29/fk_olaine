import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLeagueLogosForDisplay } from "@/lib/league-standings-server";
import { getAllGamesFromDb } from "@/lib/games-server";
import { UpcomingMatches } from "@/components/upcoming-matches";

export async function HomeUpcomingGames() {
  const [games, leagues] = await Promise.all([getAllGamesFromDb(), getLeagueLogosForDisplay()]);
  const next = games.filter((game) => !game.isPast).sort((a, b) => a.rawDate.localeCompare(b.rawDate) || a.time.localeCompare(b.time))[0];
  if (!next) return null;
  return <section className="bg-white px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
    <UpcomingMatches games={[next]} leagues={leagues} showFixtures={false} />
    <div className="mt-6 flex justify-center">
      <Link href="/speles" className="flex min-h-11 items-center gap-3 border-2 border-black px-5 text-sm font-semibold text-black uppercase hover:bg-black hover:text-white focus-visible:outline-black">Visas spēles<ArrowRight className="size-4" aria-hidden="true" /></Link>
    </div>
  </section>;
}
