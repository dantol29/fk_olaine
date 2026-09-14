import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { gameDate } from "@/lib/games";
import { getAllGamesFromDb, type GameListItem } from "@/lib/games-server";
import { GameFixtureCard, TeamLogo } from "@/components/game-fixture-card";
import { GamesMonthCalendar } from "@/components/games-month-calendar";

/** Mirrors GameRow's desktop/mobile markup from games-directory.tsx (the
 *  /speles page) so this homepage section reads as the same component. */
function HomeGameRow({ game }: { game: GameListItem }) {
  return (
    <>
      <div className="sm:hidden">
        <GameFixtureCard game={game} />
      </div>

      <div
        className={cn(
          "hidden items-center gap-8 py-7 sm:flex",
          game.isPast && "opacity-50",
        )}
      >
        <div className="flex w-16 shrink-0 flex-col items-start leading-none text-slate-600">
          <span className="text-4xl font-extrabold">{game.day}</span>
          <span className="mt-1 text-sm font-semibold text-slate-400 uppercase">
            {game.month}
          </span>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-5">
          <div className="flex min-w-0 w-64 items-center justify-end gap-5">
            <span className="min-w-0 line-clamp-2 text-right text-base leading-tight font-semibold text-club-navy uppercase">
              {game.home.name}
            </span>
            <TeamLogo team={game.home} className="h-14 w-14" />
          </div>

          <span className="shrink-0 text-3xl font-extrabold text-club-navy">
            {game.time}
          </span>

          <div className="flex min-w-0 w-64 items-center gap-5">
            <TeamLogo team={game.away} className="h-14 w-14" />
            <span className="min-w-0 line-clamp-2 text-base leading-tight font-semibold text-club-navy uppercase">
              {game.away.name}
            </span>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 flex-col gap-1.5 text-base text-slate-400 lg:flex">
          <span className="flex w-full items-center gap-1.5 line-clamp-2 leading-tight">
            <MapPin className="h-5 w-5 shrink-0" />
            {game.venue}
          </span>
          <span className="w-fit max-w-full self-center truncate rounded-full bg-slate-100 px-4 py-2 text-sm text-club-navy">
            {game.league}
          </span>
        </div>
      </div>
    </>
  );
}

export async function HomeUpcomingGames() {
  const games = await getAllGamesFromDb();

  const upcoming = games
    .filter((game) => !game.isPast)
    .sort((a, b) => gameDate(a).getTime() - gameDate(b).getTime());

  const displayed = upcoming.slice(0, 4);

  if (games.length === 0) return null;

  return (
    <section className="px-6 pt-8 pb-6 lg:pb-0">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-5 flex items-center justify-center gap-4 sm:mb-6 sm:justify-between">
          <div className="relative flex min-h-24 min-w-0 flex-1 flex-col items-center justify-center sm:min-h-32 sm:items-start">
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:text-8xl"
            >
              Spēles
            </span>
            <h2 className="relative text-center text-3xl tracking-[-0.02em] text-club-navy sm:text-left sm:text-4xl">
              Spēles
            </h2>
          </div>
          <Link
            href="/speles"
            className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 py-1.5 pr-1.5 pl-4 text-sm font-semibold text-club-navy transition-colors hover:border-slate-300 sm:flex"
          >
            Visas spēles
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 sm:h-8 sm:w-8">
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[980px_1fr] lg:items-stretch">
          {displayed.length > 0 ? (
            <div className="divide-y divide-slate-100 sm:rounded-2xl sm:bg-white sm:px-6">
              {displayed.map((game) => (
                <HomeGameRow key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              Spēles nav atrastas.
            </div>
          )}

          <GamesMonthCalendar games={games} className="lg:h-full lg:rounded-b-2xl" />
        </div>
      </div>
    </section>
  );
}
