"use client";

import { MapPin } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { gameDate } from "@/lib/games";
import type { GameListItem } from "@/lib/games-server";
import type { LeagueStandings } from "@/lib/league-standings-server";
import { GameFixtureCard, TeamLogo } from "@/components/game-fixture-card";
import { GamesMonthCalendar } from "@/components/games-month-calendar";
import { LeagueSelector } from "@/components/league-selector";

function GameRow({ game }: { game: GameListItem }) {
  return (
    <>
      {/* Mobile: a single horizontal line doesn't leave enough room for
       *  team names + logos + time + venue, so it stacks into several
       *  shorter rows instead. */}
      <div className="sm:hidden">
        <GameFixtureCard game={game} />
      </div>

      {/* sm and up: single horizontal fixture line. */}
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

export function GamesDirectory({
  games,
  leagues,
}: {
  games: GameListItem[];
  leagues: LeagueStandings[];
}) {
  const [activeTeam, setActiveTeam] = useState("Visas komandas");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const teamNames = useMemo(
    () => ["Visas komandas", ...new Set(games.map((game) => game.teamName))],
    [games],
  );

  function handleTeamChange(name: string) {
    setActiveTeam(name);
    setSelectedDateKey(null);
  }

  const teamFiltered = useMemo(() => {
    return games.filter(
      (game) => activeTeam === "Visas komandas" || game.teamName === activeTeam,
    );
  }, [games, activeTeam]);

  const visible = useMemo(() => {
    return teamFiltered
      .filter((game) => !game.isPast)
      .sort((a, b) => gameDate(a).getTime() - gameDate(b).getTime());
  }, [teamFiltered]);

  const selectedDateGames = useMemo(() => {
    if (!selectedDateKey) return [];
    return teamFiltered
      .filter((game) => game.rawDate === selectedDateKey)
      .sort((a, b) => gameDate(a).getTime() - gameDate(b).getTime());
  }, [teamFiltered, selectedDateKey]);

  const listGames = selectedDateKey ? selectedDateGames : visible;

  return (
    <>
      <section className="px-6 pt-14 sm:pt-14">
        <div className="mx-auto max-w-[1440px]">
          <div className="relative flex min-h-24 flex-col justify-center sm:min-h-32">
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:text-8xl"
            >
              Spēles
            </span>
            <h1 className="relative text-4xl tracking-[-0.02em] text-club-navy sm:text-5xl">
              Spēles
            </h1>
          </div>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {teamNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleTeamChange(name)}
                  aria-pressed={activeTeam === name}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm transition",
                    activeTeam === name
                      ? "bg-club-navy text-white"
                      : "bg-slate-100 text-club-navy hover:bg-slate-200",
                  )}
                >
                  {name}
                </button>
              ))}
            </div>

            {selectedDateKey && (
              <button
                type="button"
                onClick={() => setSelectedDateKey(null)}
                className="hidden text-sm font-semibold text-club-red hover:underline lg:block"
              >
                Rādīt visas spēles
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[980px_1fr]">
            <div className="hidden flex-col gap-4 lg:flex">
              {listGames.length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-2xl bg-white px-6">
                  {listGames.map((game) => (
                    <GameRow key={game.id} game={game} />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400">
                  {selectedDateKey ? "Šajā dienā spēļu nav." : "Spēles nav atrastas."}
                </div>
              )}
            </div>

            <div className="lg:hidden">
              {visible.length > 0 ? (
                <div className="divide-y divide-slate-100 sm:rounded-2xl sm:bg-white sm:px-6">
                  {visible.map((game) => (
                    <GameRow key={game.id} game={game} />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400">
                  Spēles nav atrastas.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6 lg:gap-0">
              <GamesMonthCalendar
                games={teamFiltered}
                activeDateKey={selectedDateKey}
                onSelectDate={setSelectedDateKey}
              />

              <div className="relative flex h-[760px] flex-col overflow-visible lg:overflow-hidden">
                <LeagueSelector leagues={leagues} compact />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
