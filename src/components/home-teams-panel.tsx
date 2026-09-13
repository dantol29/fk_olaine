"use client";

import Image from "next/image";
import { UserRound } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { GameListItem } from "@/lib/games-server";
import type { TrainingListItem } from "@/lib/trainings-server";
import { CollapsibleGrid } from "@/components/collapsible-grid";
import { GameFixtureCard } from "@/components/game-fixture-card";
import { TrainingFixtureCard } from "@/components/training-fixture-card";

type Player = {
  id: number;
  name: string;
  photoUrl: string | null;
};

type Coach = {
  id: number;
  name: string;
  position: string;
  photoUrl: string | null;
  license: string;
  authority: "UEFA" | "LFF";
};

const AUTHORITY_LOGO: Record<"UEFA" | "LFF", string> = {
  UEFA: "/uefa-logo.webp",
  LFF: "/partners/lff.png",
};

type Team = {
  id: number;
  name: string;
  players: Player[];
  coaches: Coach[];
  games: GameListItem[];
  trainings: TrainingListItem[];
};

const TABS = [
  { key: "players", label: "Spēlētāji" },
  { key: "coaches", label: "Treneri" },
  { key: "games", label: "Spēles" },
  { key: "trainings", label: "Treniņi" },
] as const;

type TabKey = (typeof TABS)[number]["key"];


function onlyUpcoming<T extends { isPast: boolean; rawDate: string }>(
  items: T[],
  limit: number,
): T[] {
  return items
    .filter((item) => !item.isPast)
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
    .slice(0, limit);
}

export function HomeTeamsPanel({
  teams,
  bare = false,
  className,
  defaultTab = "players",
  showTabs = true,
}: {
  teams: Team[];
  bare?: boolean;
  className?: string;
  /** Which tab is active on first render — e.g. /treneri wants "coaches"
   *  active by default instead of "players". */
  defaultTab?: TabKey;
  /** Hides the Spēlētāji/Treneri/Spēles/Treniņi tab pills, locking the
   *  view to defaultTab — e.g. /treneri only ever shows coaches. */
  showTabs?: boolean;
}) {
  const [activeTeamId, setActiveTeamId] = useState(teams[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);

  const activeTeam = teams.find((team) => team.id === activeTeamId) ?? teams[0];
  if (!activeTeam) return null;

  const displayedGames = onlyUpcoming(activeTeam.games, 6);
  const displayedTrainings = onlyUpcoming(activeTeam.trainings, 6);

  const avatarClassName = "h-24 w-24 sm:h-28 sm:w-28";
  const nameClassName = "text-sm";

  return (
    <div
      className={cn(
        "ml-[calc(50%-50vw)] grid w-screen grid-cols-1 sm:ml-0 sm:w-full lg:grid-cols-[200px_1fr]",
        !bare && "sm:overflow-hidden sm:rounded-2xl sm:bg-white",
        bare ? "lg:min-h-[48rem] lg:max-h-[48rem]" : "lg:min-h-[40rem] lg:max-h-[40rem]",
        className,
      )}
    >
      {/* Mobile/tablet: a horizontally scrollable row of team pills — the
       *  sidebar list below would otherwise push the actual roster content
       *  well below the fold on a phone. */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50 px-4 py-3 lg:hidden">
        {teams.map((team) => {
          const isActive = team.id === activeTeam.id;
          return (
            <button
              key={team.id}
              type="button"
              onClick={() => {
                setActiveTeamId(team.id);
                setActiveTab(defaultTab);
              }}
              aria-pressed={isActive}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                isActive
                  ? "bg-club-navy text-white"
                  : "bg-white text-club-navy hover:bg-slate-100",
              )}
            >
              {team.name}
            </button>
          );
        })}
      </div>

      <nav
        className={cn(
          "hidden bg-slate-50 lg:flex lg:flex-col lg:overflow-y-auto",
          bare ? "rounded-2xl" : "lg:rounded-br-2xl",
        )}
      >
        {teams.map((team) => {
          const isActive = team.id === activeTeam.id;
          return (
            <button
              key={team.id}
              type="button"
              onClick={() => {
                setActiveTeamId(team.id);
                setActiveTab(defaultTab);
              }}
              aria-pressed={isActive}
              className={cn(
                "flex items-center gap-3 px-5 py-4 text-left transition",
                isActive ? "bg-white" : "hover:bg-slate-100",
              )}
            >
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-xl tracking-[-0.02em]",
                  isActive ? "text-club-red" : "text-club-navy/80",
                )}
              >
                {team.name}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 pt-4 pb-6 sm:px-8 sm:pt-5 sm:pb-8 lg:overflow-y-auto">
        {showTabs && (
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-pressed={activeTab === tab.key}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition",
                  activeTab === tab.key
                    ? "bg-club-navy text-white"
                    : "bg-slate-100 text-club-navy hover:bg-slate-200",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className={showTabs ? "mt-8" : undefined}>
          {activeTab === "players" &&
            (activeTeam.players.length > 0 ? (
              bare ? (
                <div className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {activeTeam.players.map((player) => (
                    <div key={player.id} className="flex flex-col items-center gap-3 text-center">
                      <div
                        className={cn(
                          "relative shrink-0 overflow-hidden rounded-full bg-club-gray-light",
                          avatarClassName,
                        )}
                      >
                        {player.photoUrl ? (
                          <Image
                            src={player.photoUrl}
                            alt={player.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <UserRound className="h-9 w-9 text-club-muted" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                      <span className={cn("font-medium text-club-navy", nameClassName)}>
                        {player.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <CollapsibleGrid
                  key={activeTeam.id}
                  gridClassName="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
                  collapsedClassName="max-h-[24rem] sm:max-h-[27rem]"
                  fadeFromClassName="from-white"
                  moreHref="/komandas"
                >
                  {activeTeam.players.map((player) => (
                    <div key={player.id} className="flex flex-col items-center gap-3 text-center">
                      <div
                        className={cn(
                          "relative shrink-0 overflow-hidden rounded-full bg-club-gray-light",
                          avatarClassName,
                        )}
                      >
                        {player.photoUrl ? (
                          <Image
                            src={player.photoUrl}
                            alt={player.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <UserRound className="h-9 w-9 text-club-muted" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                      <span className={cn("font-medium text-club-navy", nameClassName)}>
                        {player.name}
                      </span>
                    </div>
                  ))}
                </CollapsibleGrid>
              )
            ) : (
              <p className="py-16 text-center text-slate-400">
                Šai komandai vēl nav pievienoti spēlētāji.
              </p>
            ))}

          {activeTab === "coaches" &&
            (activeTeam.coaches.length > 0 ? (
              <div className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {activeTeam.coaches.map((coach) => (
                  <div key={coach.id} className="flex flex-col items-center gap-3 text-center">
                    <div
                      className={cn(
                        "relative shrink-0 overflow-hidden rounded-full bg-club-gray-light",
                        avatarClassName,
                      )}
                    >
                      {coach.photoUrl ? (
                        <Image
                          src={coach.photoUrl}
                          alt={coach.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <UserRound className="h-9 w-9 text-club-muted" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className={cn("block font-medium text-club-navy", nameClassName)}>
                        {coach.name}
                      </span>
                      <span className="block text-xs text-slate-400">{coach.position}</span>
                      <span className="mt-1 hidden items-center justify-center gap-1.5 text-xs text-club-navy sm:flex">
                        <Image
                          src={AUTHORITY_LOGO[coach.authority]}
                          alt={coach.authority}
                          width={16}
                          height={16}
                          className="h-4 w-4 shrink-0 rounded-full object-contain"
                        />
                        <span className="truncate">{coach.license}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-slate-400">
                Šai komandai vēl nav piesaistīts treneris.
              </p>
            ))}

          {activeTab === "games" &&
            (displayedGames.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedGames.map((game) => (
                  <div key={game.id} className="rounded-2xl border border-slate-100">
                    <GameFixtureCard game={game} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-slate-400">
                Šai komandai nav ieplānotu spēļu.
              </p>
            ))}

          {activeTab === "trainings" &&
            (displayedTrainings.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedTrainings.map((training) => (
                  <div key={training.id} className="rounded-2xl border border-slate-100">
                    <TrainingFixtureCard training={training} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-slate-400">
                Šai komandai nav ieplānotu treniņu.
              </p>
            ))}
        </div>
      </div>
    </div>
  );
}
