"use client";

import Image from "next/image";
import { Search, UserRound, X } from "lucide-react";
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
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const categories = ["Visas komandas", ...teams.map((team) => team.name)];
  const totalPlayers = teams.reduce(
    (sum, team) => sum + team.players.length,
    0,
  );

  const q = query.trim().toLowerCase();
  const visible = teams
    .filter((team) => activeCategory === "Visas komandas" || team.name === activeCategory)
    .map((team) => ({
      ...team,
      players:
        q.length === 0
          ? team.players
          : team.players.filter((player) => player.name.toLowerCase().includes(q)),
    }))
    .filter((team) => team.players.length > 0);

  return (
    <>
      <section className="px-6 pt-14 sm:pt-14">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
          <h1 className="text-4xl text-club-navy sm:text-5xl">Komandas</h1>

          {searchOpen ? (
            <label className="relative flex w-full max-w-[220px] shrink-0 items-center sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Meklēt spēlētājus..."
                className="w-full rounded-full border border-slate-200 bg-white py-2 pr-9 pl-10 text-sm text-club-navy outline-none focus:border-club-red"
              />
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSearchOpen(false);
                }}
                aria-label="Aizvērt meklēšanu"
                className="absolute right-3.5 flex h-4 w-4 items-center justify-center text-slate-400 transition hover:text-club-navy"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </label>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Meklēt spēlētājus"
              className="shrink-0 text-club-navy transition hover:text-club-red"
            >
              <Search className="h-7 w-7" />
            </button>
          )}
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
