"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  MapPin,
  Volleyball,
  X,
} from "lucide-react";

import { OPEN_CALENDAR_EVENT_NAME } from "@/lib/calendar-bridge";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/calendar";
import { colorFor, initialsFor } from "@/lib/games";

type EventType = CalendarEvent["eventType"];

const EVENT_TYPE_STYLES: Record<
  EventType,
  {
    accent: string;
    gradient: string;
    photo: string;
    icon: typeof Volleyball;
    label: string;
    singular: string;
  }
> = {
  game: {
    accent: "bg-club-red",
    gradient: "bg-gradient-to-t from-club-red-dark via-club-red/85 to-club-red/45",
    photo: "/match-action.png",
    icon: Volleyball,
    label: "Spēles",
    singular: "Spēle",
  },
  training: {
    accent: "bg-club-navy-light",
    gradient: "bg-gradient-to-t from-club-navy via-club-navy/85 to-club-navy/45",
    photo: "/training-drill.png",
    icon: Dumbbell,
    label: "Treniņi",
    singular: "Treniņš",
  },
  other: {
    accent: "bg-slate-400",
    gradient: "bg-gradient-to-t from-slate-700 via-slate-600/85 to-slate-500/45",
    photo: "/pitch-sunset-gear.png",
    icon: CalendarDays,
    label: "Cits",
    singular: "Cits",
  },
};

const ALL_EVENT_TYPES = Object.keys(EVENT_TYPE_STYLES) as EventType[];

function formatClockTime(date: Date) {
  return new Intl.DateTimeFormat("lv-LV", {
    timeZone: "Europe/Riga",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Indexed by Date#getUTCDay() (0 = Sunday). */
const WEEKDAY_LABELS = [
  "Svētd.",
  "Pirmd.",
  "Otrd.",
  "Trešd.",
  "Ceturtd.",
  "Piektd.",
  "Sestd.",
];

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mai",
  "Jūn",
  "Jūl",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dec",
];

/** Used only when the visible days have no timed events to anchor on. */
const DEFAULT_START_HOUR = 6;
const END_HOUR = 23;
const ROW_HEIGHT = 56;
/** A full 7-day week doesn't leave enough room for event titles/time/place
 *  to be readable, so each Monday-start week is shown in two halves —
 *  Mon–Wed (3 days), then Thu–Sun (4 days) — rather than a sliding N-day
 *  window that would drift across week boundaries inconsistently. */
const CHUNK_OFFSETS = [0, 3] as const;
const CHUNK_SIZES = [3, 4] as const;
/** Tailwind needs both literal class strings present in source to
 *  generate them, so this can't be built from CHUNK_SIZES at runtime. */
const GRID_COLS_CLASS = [
  "grid-cols-[44px_repeat(3,1fr)] sm:grid-cols-[64px_repeat(3,1fr)]",
  "grid-cols-[44px_repeat(4,1fr)] sm:grid-cols-[64px_repeat(4,1fr)]",
] as const;
/** Beyond this many simultaneous events, the extra ones collapse into a
 *  "+N" chip rather than squeezing into an unreadably thin column. */
const MAX_VISIBLE_COLS = 3;
/** Every event card is at least this tall, so a 30-minute training slot
 *  doesn't render as an illegible sliver. */
const MIN_CARD_HEIGHT = 64;
/** Visual gap kept between a card and the grid lines / neighbouring cards. */
const CARD_INSET = 4;

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Monday of the week containing `date`, computed purely with UTC date
 *  math so it never shifts with the viewer's local timezone. */
function getMonday(date: Date) {
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + mondayOffset,
    ),
  );
}

/** Strips the time-of-day, keeping only the UTC calendar date. */
function toUtcMidnight(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/** The day-label info for a single date, in the shape `getVisibleDays`
 *  produces per day — used by the single-day mobile view. */
function toDayInfo(date: Date) {
  return {
    dateKey: toDateKey(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    dayNumber: date.getUTCDate(),
    monthNumber: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
    weekdayIndex: date.getUTCDay(),
  };
}

/** 0 if `date` falls Mon–Wed of its week, 1 if Thu–Sun. */
function getHalfForDate(date: Date) {
  const day = date.getUTCDay();
  const mondayIndex = day === 0 ? 6 : day - 1;
  return mondayIndex < CHUNK_SIZES[0] ? 0 : 1;
}

/** The 3 or 4 days making up one half of the Monday-start week starting
 *  at `weekStart`. */
function getVisibleDays(weekStart: Date, half: 0 | 1) {
  const offset = CHUNK_OFFSETS[half];
  const count = CHUNK_SIZES[half];

  return Array.from({ length: count }, (_, i) => {
    const date = new Date(weekStart);
    date.setUTCDate(weekStart.getUTCDate() + offset + i);
    return {
      dateKey: toDateKey(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
      ),
      dayNumber: date.getUTCDate(),
      monthNumber: date.getUTCMonth() + 1,
      year: date.getUTCFullYear(),
      weekdayIndex: date.getUTCDay(),
    };
  });
}

function todayKeyInRiga() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Riga",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function hourFraction(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Riga",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour + minute / 60;
}

type LaidOutEvent = CalendarEvent & {
  col: number;
  cols: number;
  clusterId: number;
};

/** Groups a day's events into overlap clusters and assigns each a column
 *  (greedy interval coloring), so simultaneous events sit side by side
 *  instead of stacking on top of each other. */
function layoutDayEvents(dayEvents: CalendarEvent[]): LaidOutEvent[] {
  const sorted = [...dayEvents].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const result: LaidOutEvent[] = [];

  let cluster: CalendarEvent[] = [];
  let clusterEnd = -Infinity;
  let clusterId = 0;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const columnEnds: number[] = [];
    for (const event of cluster) {
      const start = event.start.getTime();
      let col = columnEnds.findIndex((end) => end <= start);
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(event.end.getTime());
      } else {
        columnEnds[col] = event.end.getTime();
      }
      result.push({ ...event, col, cols: 0, clusterId });
    }
    const cols = columnEnds.length;
    for (let i = result.length - cluster.length; i < result.length; i++) {
      result[i].cols = cols;
    }
    clusterId += 1;
    cluster = [];
  };

  for (const event of sorted) {
    if (cluster.length > 0 && event.start.getTime() >= clusterEnd) {
      flushCluster();
      clusterEnd = -Infinity;
    }
    cluster.push(event);
    clusterEnd = Math.max(clusterEnd, event.end.getTime());
  }
  flushCluster();

  return result;
}

function getTimeBox(start: Date, end: Date, startHour: number) {
  const startFraction = Math.max(hourFraction(start), startHour);
  const endFraction = Math.min(
    Math.max(hourFraction(end), startFraction + 0.5),
    END_HOUR + 1,
  );
  const rawTop = (startFraction - startHour) * ROW_HEIGHT;
  const rawHeight = Math.max(
    (endFraction - startFraction) * ROW_HEIGHT,
    MIN_CARD_HEIGHT,
  );
  return {
    top: rawTop + CARD_INSET / 2,
    height: rawHeight - CARD_INSET,
  };
}

function EventCardBody({ event }: { event: CalendarEvent }) {
  const style = EVENT_TYPE_STYLES[event.eventType];
  const Icon = style.icon;

  return (
    <>
      <p className="flex items-start gap-1.5 text-xs leading-tight font-bold">
        <Icon className="mt-0.5 h-3 w-3 shrink-0 text-white/70" />
        <span className="line-clamp-2">{event.title}</span>
      </p>
      {(!event.allDay || event.location) && (
        <p className="mt-auto flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 pt-1 text-[10px] leading-tight text-white/70">
          {!event.allDay && (
            <span className="flex shrink-0 items-center gap-1">
              <Clock className="h-2.5 w-2.5 shrink-0" />
              {formatClockTime(event.start)}–{formatClockTime(event.end)}
            </span>
          )}
          {event.location && (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{event.location}</span>
            </span>
          )}
        </p>
      )}
    </>
  );
}

function EventCard({
  event,
  onClick,
  className,
  style,
}: {
  event: CalendarEvent;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const typeStyle = EVENT_TYPE_STYLES[event.eventType];

  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-lg text-left text-white shadow-sm transition hover:brightness-110",
        className,
      )}
    >
      <Image
        src={typeStyle.photo}
        alt=""
        fill
        sizes="220px"
        className="object-cover opacity-35 transition group-hover:opacity-45"
      />
      <div className={cn("absolute inset-0", typeStyle.gradient)} />
      <span className={cn("absolute inset-y-0 left-0 w-1", typeStyle.accent)} />
      <div className="relative z-10 flex h-full flex-col py-1.5 pr-2 pl-3">
        <EventCardBody event={event} />
      </div>
    </button>
  );
}

function TeamBadgeMini({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
      {logo ? (
        <Image src={logo} alt={name} width={40} height={40} className="h-10 w-10 object-contain" />
      ) : (
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-extrabold text-white",
            colorFor(name),
          )}
        >
          {initialsFor(name)}
        </div>
      )}
      <span className="line-clamp-2 text-[11px] leading-tight text-club-navy">{name}</span>
    </div>
  );
}

type WeekCalendarProps = {
  events: CalendarEvent[];
};

export function WeekCalendar({ events }: WeekCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [half, setHalf] = useState<0 | 1>(() => getHalfForDate(new Date()));
  const [mobileDate, setMobileDate] = useState(() => toUtcMidnight(new Date()));
  const todayKey = useMemo(() => todayKeyInRiga(), []);
  const [openOverflow, setOpenOverflow] = useState<string | null>(null);
  const overflowRef = useRef<HTMLDivElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [activeTypes, setActiveTypes] = useState<Set<EventType>>(
    () => new Set(ALL_EVENT_TYPES),
  );
  const [activeTeam, setActiveTeam] = useState("all");

  /** A header nav link like "/?type=training#kalendars" pre-selects that
   *  event type filter when the calendar first comes into view, and a
   *  "?event=<uid>" param (or a same-page "open this event" signal from
   *  e.g. the homepage matches carousel — see calendar-bridge.ts) jumps
   *  straight to that event's week/half and opens its popup. `window` is
   *  only available post-mount, so this can't be a lazy useState initializer
   *  without breaking SSR — an effect reading an external browser API on
   *  mount is the legitimate case the set-state-in-effect rule can't tell
   *  apart from deriving state from props. */
  useEffect(() => {
    const openEventByUid = (uid: string | null) => {
      if (!uid) return;
      const match = events.find((event) => event.uid === uid);
      if (!match) return;
      setWeekStart(getMonday(match.start));
      setHalf(getHalfForDate(match.start));
      setMobileDate(toUtcMidnight(match.start));
      setSelectedEvent(match);
    };

    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    if (type === "training" || type === "game" || type === "other") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTypes(new Set([type]));
    }
    openEventByUid(params.get("event"));

    const handleOpenEvent = (event: Event) => {
      openEventByUid((event as CustomEvent<{ uid: string }>).detail?.uid ?? null);
    };
    window.addEventListener(OPEN_CALENDAR_EVENT_NAME, handleOpenEvent);
    return () => window.removeEventListener(OPEN_CALENDAR_EVENT_NAME, handleOpenEvent);
  }, [events]);

  const teamOptions = useMemo(() => {
    const names = new Set<string>();
    for (const event of events) {
      if (event.team) names.add(event.team);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "lv"));
  }, [events]);

  const toggleType = (type: EventType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next.size === 0 ? new Set(ALL_EVENT_TYPES) : next;
    });
  };

  useEffect(() => {
    if (!openOverflow) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!overflowRef.current?.contains(event.target as Node)) {
        setOpenOverflow(null);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [openOverflow]);

  useEffect(() => {
    if (!selectedEvent) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedEvent(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedEvent]);

  const visibleDays = useMemo(
    () => getVisibleDays(weekStart, half),
    [weekStart, half],
  );

  const filteredEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          activeTypes.has(event.eventType) &&
          (activeTeam === "all" || event.team === activeTeam),
      ),
    [events, activeTypes, activeTeam],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of filteredEvents) {
      if (event.allDay) continue;
      const list = map.get(event.dateKey) ?? [];
      list.push(event);
      map.set(event.dateKey, list);
    }
    return map;
  }, [filteredEvents]);

  /** Skip the grid's leading empty hours — start at whatever hour the
   *  visible days' earliest event actually falls in. */
  const startHour = useMemo(() => {
    const visibleDateKeys = new Set(visibleDays.map((d) => d.dateKey));
    let earliest = Infinity;
    for (const [dateKey, dayEvents] of eventsByDay) {
      if (!visibleDateKeys.has(dateKey)) continue;
      for (const event of dayEvents) {
        earliest = Math.min(earliest, Math.floor(hourFraction(event.start)));
      }
    }
    if (!Number.isFinite(earliest)) return DEFAULT_START_HOUR;
    return Math.max(0, Math.min(earliest, END_HOUR));
  }, [eventsByDay, visibleDays]);

  const hours = useMemo(
    () =>
      Array.from({ length: END_HOUR - startHour + 1 }, (_, i) => i + startHour),
    [startHour],
  );

  const rangeStart = visibleDays[0];
  const rangeEnd = visibleDays[visibleDays.length - 1];
  const rangeLabel = `${rangeStart.dayNumber}.${String(rangeStart.monthNumber).padStart(2, "0")}. – ${rangeEnd.dayNumber}.${String(rangeEnd.monthNumber).padStart(2, "0")}.${rangeEnd.year}.`;

  // Rendered in two spots — next to "Kalendārs" on mobile, alongside the
  // event-type chips at sm and up — so it's built once and dropped into
  // whichever wrapper is visible at the current breakpoint.
  const teamFilterSelect = teamOptions.length > 0 && (
    <select
      value={activeTeam}
      onChange={(event) => setActiveTeam(event.target.value)}
      aria-label="Filtrēt pēc komandas"
      className="rounded-full border border-transparent bg-slate-100 px-4 py-2 text-sm font-semibold text-club-navy transition hover:bg-slate-200 focus:outline-none"
    >
      <option value="all">Visas komandas</option>
      {teamOptions.map((team) => (
        <option key={team} value={team}>
          {team}
        </option>
      ))}
    </select>
  );

  const navigateDays = (direction: "prev" | "next") => {
    if (direction === "next") {
      if (half === 0) {
        setHalf(1);
      } else {
        setHalf(0);
        setWeekStart((prev) => {
          const next = new Date(prev);
          next.setUTCDate(prev.getUTCDate() + 7);
          return next;
        });
      }
    } else {
      if (half === 1) {
        setHalf(0);
      } else {
        setHalf(1);
        setWeekStart((prev) => {
          const next = new Date(prev);
          next.setUTCDate(prev.getUTCDate() - 7);
          return next;
        });
      }
    }
  };

  const goToToday = () => {
    const today = new Date();
    setWeekStart(getMonday(today));
    setHalf(getHalfForDate(today));
  };

  const mobileDay = useMemo(() => toDayInfo(mobileDate), [mobileDate]);

  const mobileDayEvents = useMemo(
    () =>
      [...(eventsByDay.get(mobileDay.dateKey) ?? [])].sort(
        (a, b) => a.start.getTime() - b.start.getTime(),
      ),
    [eventsByDay, mobileDay.dateKey],
  );

  const navigateMobileDay = (direction: "prev" | "next") => {
    setMobileDate((prev) => {
      const next = new Date(prev);
      next.setUTCDate(prev.getUTCDate() + (direction === "next" ? 1 : -1));
      return next;
    });
  };

  const goToTodayMobile = () => setMobileDate(toUtcMidnight(new Date()));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-3xl text-club-navy sm:text-4xl">Kalendārs</h2>
        <span className="hidden text-2xl text-club-navy sm:block sm:text-3xl">
          {rangeLabel}
        </span>
        <div className="sm:hidden">{teamFilterSelect}</div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {ALL_EVENT_TYPES.map((type) => {
            const style = EVENT_TYPE_STYLES[type];
            const Icon = style.icon;
            const isActive = activeTypes.has(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                aria-pressed={isActive}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition",
                  isActive
                    ? style.accent
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                )}
              >
                <Icon className="h-4 w-4" />
                {style.label}
              </button>
            );
          })}
          <div className="hidden sm:block">{teamFilterSelect}</div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => navigateDays("prev")}
            aria-label="Iepriekšējās dienas"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-club-navy transition hover:bg-slate-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg bg-slate-100 px-4 pt-2 pb-3 text-sm font-semibold text-club-navy transition hover:bg-slate-200 sm:text-base"
          >
            Šī nedēļa
          </button>
          <button
            type="button"
            onClick={() => navigateDays("next")}
            aria-label="Nākamās dienas"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-club-navy transition hover:bg-slate-200"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Single-day view — the multi-column grid below doesn't leave enough
       *  room per day to stay readable on a phone, so mobile gets its own
       *  day-at-a-time list instead. */}
      <div className="sm:hidden">
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateMobileDay("prev")}
            aria-label="Iepriekšējā diena"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-club-navy transition hover:bg-slate-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={goToTodayMobile}
            className="flex flex-1 flex-col items-center rounded-lg bg-slate-100 px-2 py-2 transition hover:bg-slate-200"
          >
            <span
              className={cn(
                "text-base font-bold",
                mobileDay.dateKey === todayKey
                  ? "text-club-red"
                  : "text-club-navy",
              )}
            >
              {WEEKDAY_LABELS[mobileDay.weekdayIndex]}
            </span>
            <span className="text-xs text-slate-400">
              {mobileDay.dayNumber}. {MONTH_LABELS[mobileDay.monthNumber - 1]}{" "}
              {mobileDay.year}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateMobileDay("next")}
            aria-label="Nākamā diena"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-club-navy transition hover:bg-slate-200"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-2">
          {mobileDayEvents.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Šajā dienā nav ieplānotu notikumu.
            </p>
          ) : (
            mobileDayEvents.map((event) => {
              const style = EVENT_TYPE_STYLES[event.eventType];
              const Icon = style.icon;
              return (
                <button
                  key={event.uid}
                  type="button"
                  onClick={() => setSelectedEvent(event)}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:bg-slate-50"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white",
                      style.accent,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-club-navy">
                      {event.title}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                      <span className="flex shrink-0 items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        {formatClockTime(event.start)}–
                        {formatClockTime(event.end)}
                      </span>
                      {event.location && (
                        <span className="flex min-w-0 items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-100 sm:block">
        <div className="overflow-x-auto">
          <div className="min-w-0 sm:min-w-[560px]">
            <div className="max-h-[560px] overflow-y-auto">
              {/* Header row */}
              <div
                className={cn(
                  "sticky top-0 z-10 grid border-b border-slate-100 bg-background",
                  GRID_COLS_CLASS[half],
                )}
              >
                <div className="flex items-center justify-center p-1 text-[10px] text-slate-400 uppercase sm:p-3 sm:text-xs">
                  Laiks
                </div>
                {visibleDays.map((day) => {
                  const isToday = day.dateKey === todayKey;
                  return (
                    <div
                      key={day.dateKey}
                      className="border-l border-slate-100 p-1 text-center sm:p-2"
                    >
                      <div
                        className={cn(
                          "inline-flex flex-col items-center rounded-xl px-1 py-1 sm:px-3 sm:py-1.5",
                          isToday && "bg-club-red/5",
                        )}
                      >
                        <span
                          className={cn(
                            "truncate text-[11px] font-bold sm:text-base",
                            isToday ? "text-club-red" : "text-club-navy",
                          )}
                        >
                          {WEEKDAY_LABELS[day.weekdayIndex]}
                        </span>
                        <span className="text-[10px] text-slate-400 sm:text-xs">
                          {MONTH_LABELS[day.monthNumber - 1]} {day.dayNumber}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hour grid */}
              <div className={cn("grid", GRID_COLS_CLASS[half])}>
                <div
                  className="relative"
                  style={{ height: hours.length * ROW_HEIGHT }}
                >
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="absolute inset-x-0 border-b border-slate-50 px-1 pt-1 text-[10px] text-slate-400 sm:px-2 sm:text-xs"
                      style={{
                        top: (hour - startHour) * ROW_HEIGHT,
                        height: ROW_HEIGHT,
                      }}
                    >
                      {String(hour).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>

                {visibleDays.map((day) => {
                  const dayEvents = layoutDayEvents(
                    eventsByDay.get(day.dateKey) ?? [],
                  );
                  return (
                    <div
                      key={day.dateKey}
                      className="relative border-l border-slate-100"
                      style={{ height: hours.length * ROW_HEIGHT }}
                    >
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className="absolute inset-x-0 border-b border-slate-50"
                          style={{
                            top: (hour - startHour) * ROW_HEIGHT,
                            height: ROW_HEIGHT,
                          }}
                        />
                      ))}

                      {(() => {
                        const overCap = dayEvents.some(
                          (e) => e.cols > MAX_VISIBLE_COLS,
                        );
                        const visibleCols = overCap
                          ? MAX_VISIBLE_COLS
                          : Math.max(1, ...dayEvents.map((e) => e.cols || 1));
                        const overflowCol = MAX_VISIBLE_COLS - 1;

                        const visible = dayEvents.filter(
                          (e) =>
                            e.cols <= MAX_VISIBLE_COLS || e.col < overflowCol,
                        );
                        const overflowByCluster = new Map<
                          number,
                          CalendarEvent[]
                        >();
                        for (const e of dayEvents) {
                          if (
                            e.cols > MAX_VISIBLE_COLS &&
                            e.col >= overflowCol
                          ) {
                            const list =
                              overflowByCluster.get(e.clusterId) ?? [];
                            list.push(e);
                            overflowByCluster.set(e.clusterId, list);
                          }
                        }

                        return (
                          <>
                            {visible.map((event) => {
                              const { top, height } = getTimeBox(
                                event.start,
                                event.end,
                                startHour,
                              );
                              const cols = Math.min(event.cols, visibleCols);
                              const widthPercent = 100 / cols;
                              const leftPercent = widthPercent * event.col;

                              return (
                                <EventCard
                                  key={event.uid}
                                  event={event}
                                  onClick={() => setSelectedEvent(event)}
                                  className="absolute"
                                  style={{
                                    top,
                                    height,
                                    left: `calc(${leftPercent}% + 4px)`,
                                    width: `calc(${widthPercent}% - 8px)`,
                                  }}
                                />
                              );
                            })}

                            {Array.from(overflowByCluster.entries()).map(
                              ([clusterId, overflowEvents]) => {
                                const start = new Date(
                                  Math.min(
                                    ...overflowEvents.map((e) =>
                                      e.start.getTime(),
                                    ),
                                  ),
                                );
                                const end = new Date(
                                  Math.max(
                                    ...overflowEvents.map((e) =>
                                      e.end.getTime(),
                                    ),
                                  ),
                                );
                                const { top, height } = getTimeBox(
                                  start,
                                  end,
                                  startHour,
                                );
                                const widthPercent = 100 / visibleCols;
                                const leftPercent = widthPercent * overflowCol;
                                const chipId = `${day.dateKey}:${clusterId}`;
                                const isOpen = openOverflow === chipId;

                                return (
                                  <div
                                    key={chipId}
                                    ref={isOpen ? overflowRef : undefined}
                                    className="absolute"
                                    style={{
                                      top,
                                      height,
                                      left: `calc(${leftPercent}% + 4px)`,
                                      width: `calc(${widthPercent}% - 8px)`,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenOverflow(isOpen ? null : chipId)
                                      }
                                      className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-club-navy/70 px-1.5 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-club-navy"
                                    >
                                      +{overflowEvents.length}
                                    </button>

                                    {isOpen && (
                                      <div className="absolute top-full left-0 z-20 mt-1 flex w-48 flex-col gap-1.5 rounded-lg border border-slate-100 bg-white p-1.5 shadow-lg">
                                        {overflowEvents
                                          .sort(
                                            (a, b) =>
                                              a.start.getTime() -
                                              b.start.getTime(),
                                          )
                                          .map((event) => (
                                            <EventCard
                                              key={event.uid}
                                              event={event}
                                              onClick={() => {
                                                setSelectedEvent(event);
                                                setOpenOverflow(null);
                                              }}
                                              className="min-h-16 w-full"
                                            />
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              },
                            )}
                          </>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-white",
                    EVENT_TYPE_STYLES[selectedEvent.eventType].accent,
                  )}
                >
                  {(() => {
                    const Icon =
                      EVENT_TYPE_STYLES[selectedEvent.eventType].icon;
                    return <Icon className="h-4 w-4" />;
                  })()}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase">
                  {EVENT_TYPE_STYLES[selectedEvent.eventType].singular}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Aizvērt"
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedEvent.eventType === "game" &&
            selectedEvent.homeTeam &&
            selectedEvent.awayTeam ? (
              <div className="mt-3 flex items-center justify-between gap-2">
                <TeamBadgeMini name={selectedEvent.homeTeam} logo={selectedEvent.homeLogo ?? null} />
                <span className="shrink-0 text-xs font-extrabold text-slate-300">VS</span>
                <TeamBadgeMini name={selectedEvent.awayTeam} logo={selectedEvent.awayLogo ?? null} />
              </div>
            ) : (
              <h3 className="mt-3 text-lg font-bold text-club-navy">{selectedEvent.title}</h3>
            )}

            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-club-red" />
                {selectedEvent.weekdayLabel}, {selectedEvent.dateLabel}
              </span>
              {!selectedEvent.allDay && (
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-club-red" />
                  {formatClockTime(selectedEvent.start)} –{" "}
                  {formatClockTime(selectedEvent.end)}
                </span>
              )}
              {selectedEvent.location && (
                <span className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-club-red" />
                  <span>{selectedEvent.location}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
