"use client";

import Image from "next/image";
import { Calendar, Goal, UserRound, Users, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { GameListItem } from "@/lib/games-server";
import type { TrainingListItem } from "@/lib/trainings-server";
import { CollapsibleGrid } from "@/components/collapsible-grid";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { MatchListCard } from "@/components/upcoming-matches";
import { TrainingRow } from "@/components/trainings-directory";

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
      className="flex min-w-0 flex-col items-start gap-3 text-left"
    >
      <div className="relative w-full shrink-0">
        <div
          className={cn(
            "relative overflow-hidden rounded-none bg-club-gray-light",
            avatarClassName,
          )}
        >
          {player.photoUrl ? (
            <Image
              src={player.photoUrl}
              alt={player.name}
              fill
              sizes="(min-width: 640px) 112px, 96px"
              className="object-contain object-bottom"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UserRound className="h-9 w-9 text-club-muted" strokeWidth={1.5} />
            </div>
          )}
        </div>
      </div>
      <span className={cn("font-medium text-black", nameClassName)}>{player.name}</span>
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
      className="flex min-w-0 flex-col items-start gap-3 text-left"
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-none bg-club-gray-light",
          avatarClassName,
        )}
      >
        {coach.photoUrl ? (
          <Image
            src={coach.photoUrl}
            alt={coach.name}
            fill
            sizes="(min-width: 640px) 112px, 96px"
            className="object-contain object-bottom"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UserRound className="h-9 w-9 text-club-muted" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div>
        <span className={cn("block font-medium text-black", nameClassName)}>
          {coach.name}
        </span>
        <span className="block text-xs text-black/45">{coach.position}</span>
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
  /** Which tab is active on first render. */
  defaultTab?: TabKey;
  /** Hides the Spēlētāji/Treneri/Spēles/Treniņi tab pills, locking the
   *  view to defaultTab. */
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

  const avatarClassName = "aspect-square w-full";
  const nameClassName = "text-sm leading-snug sm:text-base";

  return (
    <div
      className={cn(
        "grid w-full min-w-0 grid-cols-1 border border-black/15",
        !bare && "overflow-hidden bg-white",
        className,
      )}
    >
      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-black/10 bg-black px-4 py-3">
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
                "shrink-0 rounded-none px-4 py-2 text-sm font-semibold transition",
                isActive
                  ? "border-b-2 border-white text-white"
                  : "border-b-2 border-transparent text-white/55 hover:text-white",
              )}
            >
              {team.name}
            </button>
          );
        })}
      </div>


      <div className="px-4 pt-4 pb-6 sm:px-8 sm:pt-5 sm:pb-8 lg:overflow-y-auto">
        {showTabs && (
          <div className="flex gap-3 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-pressed={activeTab === tab.key}
                className={cn(
                  "shrink-0 border-b-2 px-1 py-2 text-xs font-semibold uppercase",
                  activeTab === tab.key
                    ? "border-black text-black"
                    : "border-transparent text-black/45 hover:text-black",
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
                <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
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
                  gridClassName="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4"
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
              <p className="py-16 text-center text-black/45">
                Šai komandai vēl nav pievienoti spēlētāji.
              </p>
            ))}

          {activeTab === "coaches" &&
            (activeTeam.coaches.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
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
              <p className="py-16 text-center text-black/45">
                Šai komandai vēl nav piesaistīts treneris.
              </p>
            ))}

          {activeTab === "games" &&
            (displayedGames.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedGames.map((game) => (
                  <MatchListCard key={game.id} game={game} compact />
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-black/45">
                Šai komandai nav ieplānotu spēļu.
              </p>
            ))}

          {activeTab === "trainings" &&
            (displayedTrainings.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedTrainings.map((training) => (
                  <TrainingRow key={training.id} training={training} compact />
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-black/45">
                Šai komandai nav ieplānotu treniņu.
              </p>
            ))}
        </div>
      </div>

      <Drawer
        swipeDirection="right"
        open={Boolean(selectedPlayer)}
        onOpenChange={(open) => {
          if (!open) setSelectedPlayer(null);
        }}
      >
        <DrawerContent className="!h-dvh !max-h-dvh !w-[min(100vw,400px)] border-none bg-white shadow-xl data-[swipe-direction=right]:rounded-none motion-reduce:transition-none" overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-sm">
          <div className="flex items-center justify-between bg-black px-4 py-3 text-white"><DrawerTitle className="text-2xl font-normal text-white">Informācija</DrawerTitle><DrawerClose aria-label="Aizvērt" className="flex size-11 items-center justify-center"><X className="size-6" /></DrawerClose></div>
          {selectedPlayer && (
            <div className="min-h-0 flex-1 overflow-y-auto bg-white p-5 text-black">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0">
                  <div className="relative h-full w-full overflow-hidden rounded-none bg-club-gray-light">
                    {selectedPlayer.photoUrl ? (
                      <Image
                        src={selectedPlayer.photoUrl}
                        alt={selectedPlayer.name}
                        fill
                        sizes="80px"
                        className="object-contain object-bottom"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserRound className="h-8 w-8 text-club-muted" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  {selectedPlayer.number !== null && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-none bg-white px-3 text-base text-black">
                      {selectedPlayer.number}
                    </span>
                  )}
                </div>
                <h3 className="text-xl text-black">{selectedPlayer.name}</h3>
              </div>

              <div className="mt-6 flex flex-col divide-y divide-black/10">
                <div className="flex items-center gap-3 py-3 first:pt-0">
                  <Calendar className="h-4 w-4 shrink-0 text-club-red" />
                  <div>
                    <p className="text-xs text-black/45">Dzimšanas datums</p>
                    <p className="text-sm text-black">
                      {selectedPlayer.birthdate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-3">
                  <Users className="h-4 w-4 shrink-0 text-club-red" />
                  <div>
                    <p className="text-xs text-black/45">Komandas</p>
                    <p className="text-sm text-black">
                      {selectedPlayer.teams.length > 0
                        ? selectedPlayer.teams.map((t) => t.name).join(", ")
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-3 last:pb-0">
                  <Goal className="h-4 w-4 shrink-0 text-club-red" />
                  <div>
                    <p className="text-xs text-black/45">Gūtie vārti</p>
                    {selectedPlayer.teams.length > 0 ? (
                      <div className="mt-0.5 flex flex-col">
                        {selectedPlayer.teams.map((t) => (
                          <p key={t.name} className="text-sm text-black">
                            {t.name} - {t.goals}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-black">—</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <Drawer
        swipeDirection="right"
        open={Boolean(selectedCoach)}
        onOpenChange={(open) => {
          if (!open) setSelectedCoach(null);
        }}
      >
        <DrawerContent className="!h-dvh !max-h-dvh !w-[min(100vw,400px)] border-none bg-white shadow-xl data-[swipe-direction=right]:rounded-none motion-reduce:transition-none" overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-sm">
          <div className="flex items-center justify-between bg-black px-4 py-3 text-white"><DrawerTitle className="text-2xl font-normal text-white">Informācija</DrawerTitle><DrawerClose aria-label="Aizvērt" className="flex size-11 items-center justify-center"><X className="size-6" /></DrawerClose></div>
          {selectedCoach && (
            <div className="min-h-0 flex-1 overflow-y-auto bg-white p-5 text-black">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-none bg-club-gray-light">
                  {selectedCoach.photoUrl ? (
                    <Image
                      src={selectedCoach.photoUrl}
                      alt={selectedCoach.name}
                      fill
                      sizes="80px"
                      className="object-contain object-bottom"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserRound className="h-8 w-8 text-club-muted" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl text-black">{selectedCoach.name}</h3>
                  <p className="text-sm text-black/45">{selectedCoach.position}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col divide-y divide-black/10">
                <div className="flex items-center gap-3 py-3 first:pt-0">
                  <Image
                    src={AUTHORITY_LOGO[selectedCoach.authority]}
                    alt={selectedCoach.authority}
                    width={20}
                    height={20}
                    className="h-5 w-5 shrink-0 rounded-none object-contain"
                  />
                  <div>
                    <p className="text-xs text-black/45">Licence</p>
                    <p className="text-sm text-black">
                      {selectedCoach.license}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-3 last:pb-0">
                  <Users className="h-4 w-4 shrink-0 text-club-red" />
                  <div>
                    <p className="text-xs text-black/45">Komandas</p>
                    <p className="text-sm text-black">
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
