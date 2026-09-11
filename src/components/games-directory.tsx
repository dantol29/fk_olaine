"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { gameDate, type Team } from "@/lib/games";
import type { GameListItem } from "@/lib/games-server";
import type { LeagueStandings } from "@/lib/league-standings-server";
import { LeagueSelector } from "@/components/league-selector";

function TeamLogo({ team, className }: { team: Team; className?: string }) {
  return team.logo ? (
    <Image
      src={team.logo}
      alt={team.name}
      width={56}
      height={56}
      className={cn(
        "shrink-0 rounded-full bg-white object-contain ring-1 ring-black/5",
        className ?? "h-9 w-9 sm:h-11 sm:w-11",
      )}
    />
  ) : (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white",
        team.color ?? "bg-club-navy",
        className ?? "h-9 w-9 sm:h-11 sm:w-11",
      )}
    >
      {team.initials ?? team.name.slice(0, 3).toUpperCase()}
    </span>
  );
}

function GameRow({ game }: { game: GameListItem }) {
  return (
    <>
      {/* Mobile: a single horizontal line doesn't leave enough room for
       *  team names + logos + time + venue, so it stacks into several
       *  shorter rows instead. */}
      <div className={cn("flex flex-col items-center gap-1.5 px-4 py-4 sm:hidden", game.isPast && "opacity-50")}>
        <div className="flex w-full items-start justify-between gap-2">
          <div className="leading-none text-slate-600">
            <span className="text-lg font-extrabold">{game.day}</span>
            <span className="ml-1.5 text-[10px] font-semibold uppercase">{game.month}</span>
          </div>

          <div className="flex flex-col items-end text-right text-xs text-slate-400">
            <span>{game.venue}</span>
            <span>{game.league}</span>
          </div>
        </div>

        <div className="mt-1.5 flex w-full items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <TeamLogo team={game.home} className="h-14 w-14" />
            <span className="min-w-0 line-clamp-2 text-center text-sm leading-tight font-semibold text-club-navy uppercase">
              {game.home.name}
            </span>
          </div>

          <span className="mt-3.5 shrink-0 text-xl font-extrabold text-club-navy">
            {game.time}
          </span>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <TeamLogo team={game.away} className="h-14 w-14" />
            <span className="min-w-0 line-clamp-2 text-center text-sm leading-tight font-semibold text-club-navy uppercase">
              {game.away.name}
            </span>
          </div>
        </div>
      </div>

      {/* sm and up: single horizontal fixture line. */}
      <div
        className={cn(
          "hidden items-center gap-6 px-6 py-5 sm:flex",
          game.isPast && "opacity-50",
        )}
      >
        <div className="flex w-14 shrink-0 flex-col items-start leading-none text-slate-600">
          <span className="text-3xl font-extrabold">{game.day}</span>
          <span className="mt-1 text-xs font-semibold text-slate-400 uppercase">{game.month}</span>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-4">
          <div className="flex min-w-0 w-56 items-center justify-end gap-4">
            <span className="min-w-0 line-clamp-2 text-right text-sm leading-tight font-semibold text-club-navy uppercase">
              {game.home.name}
            </span>
            <TeamLogo team={game.home} />
          </div>

          <span className="shrink-0 text-2xl font-extrabold text-club-navy">{game.time}</span>

          <div className="flex min-w-0 w-56 items-center gap-4">
            <TeamLogo team={game.away} />
            <span className="min-w-0 line-clamp-2 text-sm leading-tight font-semibold text-club-navy uppercase">
              {game.away.name}
            </span>
          </div>
        </div>

        <div className="hidden min-w-0 shrink flex-col gap-1 text-xs text-slate-400 lg:flex">
          <span className="w-full line-clamp-2 leading-tight">{game.venue}</span>
          <span className="w-full truncate">{game.league}</span>
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

  const teamNames = useMemo(
    () => ["Visas komandas", ...new Set(games.map((game) => game.teamName))],
    [games],
  );

  const visible = useMemo(() => {
    return games
      .filter((game) => !game.isPast)
      .filter((game) => activeTeam === "Visas komandas" || game.teamName === activeTeam)
      .sort((a, b) => gameDate(a).getTime() - gameDate(b).getTime());
  }, [games, activeTeam]);

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
                  onClick={() => setActiveTeam(name)}
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
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[820px_1fr]">
            {visible.length > 0 ? (
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white">
                {visible.map((game) => (
                  <GameRow key={game.id} game={game} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-400">
                Spēles nav atrastas.
              </div>
            )}

            <div className="relative flex h-[760px] flex-col overflow-hidden">
              <LeagueSelector leagues={leagues} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
