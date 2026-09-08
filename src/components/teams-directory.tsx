"use client";

import Image from "next/image";
import { UserRound } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type Player = {
  photo?: string;
  name: string;
  birthdate: string;
};

type Team = {
  name: string;
  players: Player[];
};

function PlayerCard({ player }: { player: Player }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-square bg-club-gray-light">
        {player.photo ? (
          <Image
            src={player.photo}
            alt={player.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UserRound
              className="h-10 w-10 text-club-muted"
              strokeWidth={1.5}
            />
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-sm  text-club-navy">{player.name}</p>
        <p className="text-xs text-slate-400">{player.birthdate}</p>
      </div>
    </div>
  );
}

function TeamSection({ team }: { team: Team }) {
  return (
    <div className="mb-10">
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="text-xl text-club-navy">{team.name}</h2>
        <span className="text-sm text-slate-400">
          {team.players.length} spēlētāji
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {team.players.map((player) => (
          <PlayerCard key={player.name} player={player} />
        ))}
      </div>
    </div>
  );
}

export function TeamsDirectory({ teams }: { teams: Team[] }) {
  const [activeCategory, setActiveCategory] = useState("Visas komandas");

  const categories = ["Visas komandas", ...teams.map((team) => team.name)];
  const totalPlayers = teams.reduce(
    (sum, team) => sum + team.players.length,
    0,
  );

  const visible =
    activeCategory === "Visas komandas"
      ? teams
      : teams.filter((team) => team.name === activeCategory);

  return (
    <>
      <section className="px-6 pt-4">
        <div className="relative mx-auto h-[240px] max-w-[1440px] overflow-hidden rounded-[2rem] sm:h-[280px]">
          <Image
            src="/tactics-board-dusk.png"
            alt="FK Olaine komandas"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />

          <div className="relative z-10 flex h-full w-full flex-col justify-center px-6 sm:px-10">
            <h1 className="text-5xl text-white sm:text-6xl">Komandas</h1>

            <p className="mt-4 text-sm text-white/70 sm:text-base">
              Dažādos vecumos. Viena komanda.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm transition",
                    activeCategory === category
                      ? "bg-club-navy text-white"
                      : "bg-slate-100 text-club-navy hover:bg-slate-200",
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs font-semibold tracking-[0.15em] text-slate-400 uppercase">
              <span className="h-px w-8 bg-slate-300" />
              {totalPlayers} spēlētāji
            </div>
          </div>

          {visible.map((team) => (
            <TeamSection key={team.name} team={team} />
          ))}
        </div>
      </section>
    </>
  );
}
