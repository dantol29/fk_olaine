"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { CalendarModal } from "@/components/calendar-modal";
import { CalendarEventTeams } from "@/components/calendar-event-teams";
import { MatchListCard } from "@/components/upcoming-matches";
import { TrainingRow } from "@/components/trainings-directory";
import type { CalendarEvent } from "@/lib/calendar";
import { leagueForGame } from "@/lib/game-league";
import type { LeagueStandings } from "@/lib/league-standings-server";
import type { GameListItem } from "@/lib/games-server";

const FULL_MONTHS_LV = [
  "Janvāris",
  "Februāris",
  "Marts",
  "Aprīlis",
  "Maijs",
  "Jūnijs",
  "Jūlijs",
  "Augusts",
  "Septembris",
  "Oktobris",
  "Novembris",
  "Decembris",
];

const WEEKDAY_SHORT_LV = ["Pr", "Ot", "Tr", "Ce", "Pk", "Se", "Sv"];

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getAdjacentMonth(year: number, month: number, offset: number) {
  const date = new Date(Date.UTC(year, month + offset, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

type Cell = { day: number; year: number; month: number; muted: boolean };

const EMPTY_GAMES: GameListItem[] = [];
const EMPTY_EVENTS: CalendarEvent[] = [];

export function MonthCalendar({
  games = EMPTY_GAMES,
  events = EMPTY_EVENTS,
  today,
  minMonth,
  maxMonth,
  leagues = [],
  activeDateKey,
  onSelectDate,
  className,
  compact = false,
  theme = "dark",
}: {
  games?: GameListItem[];
  events?: CalendarEvent[];
  today?: string;
  minMonth?: string;
  maxMonth?: string;
  leagues?: LeagueStandings[];
  /** The date currently shown in the desktop left-side list (see
   *  GamesDirectory) — highlighted here so the two stay visually linked. */
  activeDateKey?: string | null;
  /** Clicking a match date reports it here instead of opening the detail drawer. */
  onSelectDate?: (dateKey: string) => void;
  /** Extra classes merged onto the root — lets callers override the default
   *  lg:rounded-b-none (only correct when another card sits flush beneath
   *  it, e.g. /speles's league table) or stretch/match height elsewhere. */
  className?: string;
  compact?: boolean;
  theme?: "dark" | "home";
}) {
  const home = theme === "home";
  const [cursor, setCursor] = useState(() => {
    if (today) {
      const [year, month] = today.split("-").map(Number);
      return { year, month: month - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const gamesByDate = useMemo(() => {
    const map = new Map<string, GameListItem[]>();
    for (const game of games) {
      const list = map.get(game.rawDate) ?? [];
      list.push(game);
      map.set(game.rawDate, list);
    }
    return map;
  }, [games]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.dateKey) ?? [];
      list.push(event);
      map.set(event.dateKey, list);
    }
    return map;
  }, [events]);

  const todayKey = useMemo(() => {
    if (today) return today;
    const now = new Date();
    return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  }, [today]);

  const { year, month } = cursor;
  const firstWeekdayIndex = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const prevYM = getAdjacentMonth(year, month, -1);
  const nextYM = getAdjacentMonth(year, month, 1);
  const daysInPrevMonth = new Date(Date.UTC(prevYM.year, prevYM.month + 1, 0)).getUTCDate();

  const leading: Cell[] = Array.from({ length: firstWeekdayIndex }, (_, i) => ({
    day: daysInPrevMonth - firstWeekdayIndex + 1 + i,
    year: prevYM.year,
    month: prevYM.month,
    muted: true,
  }));
  const current: Cell[] = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    year,
    month,
    muted: false,
  }));
  const trailingCount = (7 - ((leading.length + current.length) % 7)) % 7;
  const trailing: Cell[] = Array.from({ length: trailingCount }, (_, i) => ({
    day: i + 1,
    year: nextYM.year,
    month: nextYM.month,
    muted: true,
  }));
  const cells: Cell[] = [...leading, ...current, ...trailing];

  function goToMonth(direction: -1 | 1) {
    setCursor((current) => {
      const next = new Date(Date.UTC(current.year, current.month + direction, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });
  }

  const cursorMonth = toDateKey(year, month, 1).slice(0, 7);
  const selectedEvents = selectedDateKey ? (eventsByDate.get(selectedDateKey) ?? []) : [];
  const selectedGames = selectedDateKey ? (gamesByDate.get(selectedDateKey) ?? []) : [];

  return (
    <div
      className={cn(
        "ml-[calc(50%-50vw)] w-screen rounded-2xl bg-club-navy pt-6 pr-4 pb-4 pl-6 text-white sm:ml-0 sm:w-full sm:min-w-0 sm:max-w-full sm:pt-8 sm:pr-5 sm:pb-5 sm:pl-8 lg:rounded-b-none",
        compact && "p-5 sm:p-5",
        home && "ml-0 w-full rounded-none bg-white px-0 pt-0 pb-0 pl-0 text-black sm:px-0 sm:pt-0 sm:pb-0",
        className,
      )}
    >
      <div className={cn("flex items-start justify-between gap-4 pr-4 pl-2 sm:px-0", home && "px-0")}>
        <h3 className={cn("text-3xl tracking-[-0.02em] sm:text-4xl", compact && "text-2xl sm:text-2xl", home && "text-2xl font-semibold uppercase sm:text-3xl")}>
          {FULL_MONTHS_LV[month]}{events !== EMPTY_EVENTS && <span className={cn("ml-2 text-sm text-white/55", home && "font-normal text-black/55")}>{year}</span>}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            disabled={Boolean(minMonth && cursorMonth <= minMonth)}
            aria-label="Iepriekšējais mēnesis"
            className={cn("flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-white transition hover:border-white/30 hover:bg-white/10 disabled:cursor-default disabled:opacity-30", home && "rounded-none border-2 border-black text-black hover:border-black hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            disabled={Boolean(maxMonth && cursorMonth >= maxMonth)}
            aria-label="Nākamais mēnesis"
            className={cn("flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-white transition hover:border-white/30 hover:bg-white/10 disabled:cursor-default disabled:opacity-30", home && "rounded-none border-2 border-black text-black hover:border-black hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={cn("mt-6 grid grid-cols-7 gap-x-1 text-center text-sm font-semibold text-white/40 uppercase sm:gap-x-2 sm:text-xs", home && "mt-6 gap-x-0 bg-black text-white sm:mt-12 sm:gap-x-0")}>
        {WEEKDAY_SHORT_LV.map((label) => (
          <span key={label} className={home ? "py-3" : undefined}>{label}</span>
        ))}
      </div>

      <div className={cn("mt-2 grid grid-cols-7 gap-x-1 gap-y-2 sm:gap-x-2 sm:gap-y-3", home && "mt-0 gap-0 border-l border-black/10 sm:gap-0")}>
        {cells.map((cell, index) => {
          const dateKey = toDateKey(cell.year, cell.month, cell.day);
          const dayGames = cell.muted ? [] : (gamesByDate.get(dateKey) ?? []);
          const dayEvents = cell.muted ? [] : (eventsByDate.get(dateKey) ?? []);
          const hasItems = dayGames.length + dayEvents.length > 0;
          const isToday = !cell.muted && dateKey === todayKey;
          const isActive = !cell.muted && dateKey === (activeDateKey ?? selectedDateKey);

          const number = (
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold transition sm:h-11 sm:w-11 sm:text-xl",
                compact && "h-9 w-9 text-base sm:h-9 sm:w-9 sm:text-base",
                cell.muted && "text-white/20",
                !cell.muted && !isToday && "text-white",
                isToday && "bg-club-navy-light/70 text-white",
                isActive && "bg-club-red text-white",
                home && "rounded-none text-black",
                home && cell.muted && "text-black/20",
                home && isToday && "bg-black text-white",
                home && isActive && "bg-club-red text-white",
              )}
            >
              {cell.day}
            </span>
          );

          const kinds = [...new Set([
            ...dayGames.map(() => "game" as const),
            ...dayEvents.map((event) => event.eventType),
          ])];
          const dot = (
            <span className="flex h-1.5 items-center justify-center gap-1" aria-hidden="true">
              {kinds.length ? kinds.map((kind) => <span key={kind} className={cn("size-1.5 rounded-full", kind === "game" ? "bg-club-red" : kind === "training" ? (home ? "bg-black" : "bg-white") : (home ? "bg-black/40" : "bg-white/45"))} />) : <span className="size-1.5" />}
            </span>
          );

          if (cell.muted || !hasItems) {
            return (
              <div
                key={`${cell.year}-${cell.month}-${index}`}
                className={cn("flex flex-col items-center justify-start gap-1.5 py-1", home && "min-h-14 border-r border-b border-black/10 py-2", home && cell.muted && "bg-black/[0.02]")}
              >
                {number}
                {dot}
              </div>
            );
          }

          return (
            <button
              key={`${cell.year}-${cell.month}-${index}`}
              type="button"
              aria-label={`${cell.day}. ${FULL_MONTHS_LV[month]} ${year}, ${dayGames.length + dayEvents.length} notikumi`}
              aria-pressed={isActive}
              onClick={() => {
                if (onSelectDate) {
                  onSelectDate(dateKey);
                  return;
                }
                setSelectedDateKey(dateKey);
                setDrawerOpen(true);
              }}
              className={cn("flex flex-col items-center justify-start gap-1.5 rounded-lg py-1 transition hover:bg-white/5", home && "min-h-14 rounded-none border-r border-b border-black/10 py-2 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-black")}
            >
              {number}
              {dot}
            </button>
          );
        })}
      </div>

      {events !== EMPTY_EVENTS && <div className={cn("mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/15 pt-4 text-xs text-white/65", home && "border-black/15 text-black/60")}>
        {[{ label: "Spēles", color: "bg-club-red" }, { label: "Treniņi", color: home ? "bg-black" : "bg-white" }, { label: "Pasākumi", color: home ? "bg-black/40" : "bg-white/45" }].map(({ label, color }) => <span key={label} className="flex items-center gap-1.5"><span className={cn("size-1.5 rounded-full", color)} aria-hidden="true" />{label}</span>)}
      </div>}
      <CalendarModal open={drawerOpen} onOpenChange={setDrawerOpen}
        title={selectedDateKey ? new Intl.DateTimeFormat("lv-LV", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${selectedDateKey}T12:00:00Z`)) : "Kalendāra notikumi"}>
        {selectedGames.length + selectedEvents.length === 0 ? (
          <p className="text-sm text-slate-400">Šajā dienā nav ieplānotu notikumu.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {selectedGames.map((game) => <div key={game.id}>
              <MatchListCard game={game} league={leagueForGame(game, leagues)} completed={game.isPast} drawer showInfo={false} />
            </div>)}
            {selectedEvents.map((event) => <div key={event.uid}>
              <p className="mb-2 text-xs font-semibold text-black/45 uppercase">{event.club ?? "FK Olaine"} · {event.eventType === "game" ? "Spēle" : event.eventType === "training" ? "Treniņš" : "Pasākums"}</p>
              {event.gameFixture ? <MatchListCard game={event.gameFixture} league={leagueForGame(event.gameFixture, leagues)} completed={event.gameFixture.isPast} drawer showInfo={false} />
                : event.trainingFixture ? <TrainingRow training={event.trainingFixture} compact showTeam />
                  : <article className="border border-black/10 bg-white p-5 text-black">
                    <p className="text-xl leading-none font-semibold text-black tabular-nums sm:text-2xl">{event.allDay ? "Visa diena" : `${event.timeLabel ?? ""}–${new Intl.DateTimeFormat("lv-LV", { timeZone: "Europe/Riga", hour: "2-digit", minute: "2-digit" }).format(new Date(event.end))}`}</p>
                    <h3 className="mt-2 text-lg font-semibold">{event.title}</h3>
                    <CalendarEventTeams team={event.team} teamNames={event.teamNames} location={event.location} className="mt-3" />
                  </article>}
            </div>)}
          </div>
        )}
      </CalendarModal>
    </div>
  );
}
