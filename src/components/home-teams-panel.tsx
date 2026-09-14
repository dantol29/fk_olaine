"use client";

import Image from "next/image";
import { Calendar, Goal, UserRound, Users } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { GameListItem } from "@/lib/games-server";
import type { TrainingListItem } from "@/lib/trainings-server";
import { CollapsibleGrid } from "@/components/collapsible-grid";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { GameFixtureCard } from "@/components/game-fixture-card";
import { TrainingFixtureCard } from "@/components/training-fixture-card";

type Player = {
  id: number;
  name: string;
  photoUrl: string | null;
  birthdate: string;
  number: number | null;
  /** One entry per team the player is on, each with that team's own goal
   *  tally — a player playing across leagues can have a different count
   *  in each. */
  teams: { name: string; goals: number }[];
};

type Coach = {
  id: number;
  name: string;
  position: string;
  photoUrl: string | null;
  license: string;
  authority: "UEFA" | "LFF";
  teamNames: string[];
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

/** A player avatar in the grid — clicking it opens the detail drawer
 *  (birthdate, teams, goals) instead of navigating anywhere. */
function PlayerCell({
  player,
  avatarClassName,
  nameClassName,
  onSelect,
}: {
  player: Player;
  avatarClassName: string;
  nameClassName: string;
  onSelect: (player: Player) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(player)}
      className="flex flex-col items-center gap-3 text-center"
    >
      <div className="relative shrink-0">
        <div
          className={cn(
            "relative overflow-hidden rounded-full bg-club-gray-light",
            avatarClassName,
          )}
        >
          {player.photoUrl ? (
            <Image
              src={player.photoUrl}
              alt={player.name}
              fill
              sizes="(min-width: 640px) 112px, 96px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UserRound className="h-9 w-9 text-club-muted" strokeWidth={1.5} />
            </div>
          )}
        </div>
      </div>
      <span className={cn("font-medium text-club-navy", nameClassName)}>{player.name}</span>
    </button>
  );
}

/** A coach avatar in the grid — clicking it opens the detail drawer
 *  (position, license, teams) instead of navigating anywhere. Only name and
 *  position show in the grid itself; license lives in the drawer. */
function CoachCell({
  coach,
  avatarClassName,
  nameClassName,
  onSelect,
}: {
  coach: Coach;
  avatarClassName: string;
  nameClassName: string;
  onSelect: (coach: Coach) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(coach)}
      className="flex flex-col items-center gap-3 text-center"
    >
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
            sizes="(min-width: 640px) 112px, 96px"
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
      </div>
    </button>
  );
}

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
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
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
                    <PlayerCell
                      key={player.id}
                      player={player}
                      avatarClassName={avatarClassName}
                      nameClassName={nameClassName}
                      onSelect={setSelectedPlayer}
                    />
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
                    <PlayerCell
                      key={player.id}
                      player={player}
                      avatarClassName={avatarClassName}
                      nameClassName={nameClassName}
                      onSelect={setSelectedPlayer}
                    />
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
                  <CoachCell
                    key={coach.id}
                    coach={coach}
                    avatarClassName={avatarClassName}
                    nameClassName={nameClassName}
                    onSelect={setSelectedCoach}
                  />
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

      <Drawer
        open={Boolean(selectedPlayer)}
        onOpenChange={(open) => {
          if (!open) setSelectedPlayer(null);
        }}
      >
        <DrawerContent className="border-none bg-transparent shadow-none">
          {selectedPlayer && (
            <div className="mx-auto w-full max-w-sm rounded-t-2xl border border-border bg-white p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0">
                  <div className="relative h-full w-full overflow-hidden rounded-full bg-club-gray-light">
                    {selectedPlayer.photoUrl ? (
                      <Image
                        src={selectedPlayer.photoUrl}
                        alt={selectedPlayer.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserRound className="h-8 w-8 text-club-muted" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  {selectedPlayer.number !== null && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 text-base text-black">
                      {selectedPlayer.number}
                    </span>
                  )}
                </div>
                <h3 className="text-xl text-club-navy">{selectedPlayer.name}</h3>
              </div>

              <div className="mt-6 flex flex-col divide-y divide-slate-100">
                <div className="flex items-center gap-3 py-3 first:pt-0">
                  <Calendar className="h-4 w-4 shrink-0 text-club-red" />
                  <div>
                    <p className="text-xs text-slate-400">Dzimšanas datums</p>
                    <p className="text-sm text-club-navy">
                      {selectedPlayer.birthdate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-3">
                  <Users className="h-4 w-4 shrink-0 text-club-red" />
                  <div>
                    <p className="text-xs text-slate-400">Komandas</p>
                    <p className="text-sm text-club-navy">
                      {selectedPlayer.teams.length > 0
                        ? selectedPlayer.teams.map((t) => t.name).join(", ")
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-3 last:pb-0">
                  <Goal className="h-4 w-4 shrink-0 text-club-red" />
                  <div>
                    <p className="text-xs text-slate-400">Gūtie vārti</p>
                    {selectedPlayer.teams.length > 0 ? (
                      <div className="mt-0.5 flex flex-col">
                        {selectedPlayer.teams.map((t) => (
                          <p key={t.name} className="text-sm text-club-navy">
                            {t.name} - {t.goals}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-club-navy">—</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <Drawer
        open={Boolean(selectedCoach)}
        onOpenChange={(open) => {
          if (!open) setSelectedCoach(null);
        }}
      >
        <DrawerContent className="border-none bg-transparent shadow-none">
          {selectedCoach && (
            <div className="mx-auto w-full max-w-sm rounded-t-2xl border border-border bg-white p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-club-gray-light">
                  {selectedCoach.photoUrl ? (
                    <Image
                      src={selectedCoach.photoUrl}
                      alt={selectedCoach.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserRound className="h-8 w-8 text-club-muted" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl text-club-navy">{selectedCoach.name}</h3>
                  <p className="text-sm text-slate-400">{selectedCoach.position}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col divide-y divide-slate-100">
                <div className="flex items-center gap-3 py-3 first:pt-0">
                  <Image
                    src={AUTHORITY_LOGO[selectedCoach.authority]}
                    alt={selectedCoach.authority}
                    width={20}
                    height={20}
                    className="h-5 w-5 shrink-0 rounded-full object-contain"
                  />
                  <div>
                    <p className="text-xs text-slate-400">Licence</p>
                    <p className="text-sm text-club-navy">
                      {selectedCoach.license}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-3 last:pb-0">
                  <Users className="h-4 w-4 shrink-0 text-club-red" />
                  <div>
                    <p className="text-xs text-slate-400">Komandas</p>
                    <p className="text-sm text-club-navy">
                      {selectedCoach.teamNames.length > 0
                        ? selectedCoach.teamNames.join(", ")
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
