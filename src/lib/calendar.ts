import { and, eq, gte, lte } from "drizzle-orm";

import { db } from "@/db/client";
import { events, games, teams, trainings } from "@/db/schema";

export type CalendarEvent = {
  uid: string;
  title: string;
  location: string | null;
  allDay: boolean;
  start: Date;
  end: Date;
  /** Riga-local calendar date, e.g. "2026-09-07" — timezone-safe grouping key. */
  dateKey: string;
  weekdayLabel: string;
  dateLabel: string;
  timeLabel: string | null;
  dayLabel: string;
  monthLabel: string;
  /** What kind of event this is, for at-a-glance color/icon coding. */
  eventType: "game" | "training" | "other";
};

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatLabels(start: Date, allDay: boolean) {
  const weekdayLabel = capitalize(
    new Intl.DateTimeFormat("lv-LV", {
      timeZone: "Europe/Riga",
      weekday: "long",
    }).format(start),
  );
  const dateLabel = new Intl.DateTimeFormat("lv-LV", {
    timeZone: "Europe/Riga",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(start);
  const timeLabel = allDay
    ? null
    : new Intl.DateTimeFormat("lv-LV", {
        timeZone: "Europe/Riga",
        hour: "2-digit",
        minute: "2-digit",
      }).format(start);
  const dayLabel = new Intl.DateTimeFormat("lv-LV", {
    timeZone: "Europe/Riga",
    day: "2-digit",
  }).format(start);
  const monthLabel = capitalize(
    new Intl.DateTimeFormat("lv-LV", {
      timeZone: "Europe/Riga",
      month: "short",
    }).format(start),
  ).replace(".", "");
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Riga",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(start);

  return {
    weekdayLabel,
    dateLabel,
    timeLabel,
    dayLabel,
    monthLabel,
    dateKey,
  };
}

export function toDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Riga",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function timeToParts(time: string): [number, number] {
  const [hour, minute] = time.split(":").map(Number);
  return [hour, minute];
}

function dateKeyToParts(dateKey: string): [number, number, number] {
  const [year, month, day] = dateKey.split("-").map(Number);
  return [year, month, day];
}

/** Converts a Riga wall-clock time (as printed on lff.lv) into the real
 *  UTC instant it refers to, correctly accounting for DST. */
function rigaWallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const guessUtc = Date.UTC(year, month - 1, day, hour, minute);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Riga",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(guessUtc));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  const rigaAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return new Date(guessUtc - (rigaAsUtc - guessUtc));
}

async function getAdminTrainingEvents(after: Date, before: Date): Promise<CalendarEvent[]> {
  const afterKey = toDateKey(after);
  const beforeKey = toDateKey(before);

  const rows = await db
    .select({
      id: trainings.id,
      date: trainings.date,
      startTime: trainings.startTime,
      endTime: trainings.endTime,
      location: trainings.location,
      teamName: teams.name,
    })
    .from(trainings)
    .innerJoin(teams, eq(trainings.teamId, teams.id))
    .where(and(gte(trainings.date, afterKey), lte(trainings.date, beforeKey)));

  return rows.map((row) => {
    const [year, month, day] = dateKeyToParts(row.date);
    const start = rigaWallClockToUtc(year, month, day, ...timeToParts(row.startTime));
    const end = rigaWallClockToUtc(year, month, day, ...timeToParts(row.endTime));

    return {
      uid: `training-${row.id}`,
      title: `${row.teamName} treniņš`,
      location: row.location,
      allDay: false,
      start,
      end,
      eventType: "training",
      ...formatLabels(start, false),
    };
  });
}

async function getAdminEvents(after: Date, before: Date): Promise<CalendarEvent[]> {
  const afterKey = toDateKey(after);
  const beforeKey = toDateKey(before);

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      date: events.date,
      startTime: events.startTime,
      endTime: events.endTime,
      location: events.location,
    })
    .from(events)
    .where(and(gte(events.date, afterKey), lte(events.date, beforeKey)));

  return rows.map((row) => {
    const [year, month, day] = dateKeyToParts(row.date);
    const start = rigaWallClockToUtc(year, month, day, ...timeToParts(row.startTime));
    const end = rigaWallClockToUtc(year, month, day, ...timeToParts(row.endTime));

    return {
      uid: `event-${row.id}`,
      title: row.title,
      location: row.location,
      allDay: false,
      start,
      end,
      eventType: "other",
      ...formatLabels(start, false),
    };
  });
}

async function getAdminGameEvents(after: Date, before: Date): Promise<CalendarEvent[]> {
  const afterKey = toDateKey(after);
  const beforeKey = toDateKey(before);

  const rows = await db
    .select({
      id: games.id,
      homeTeam: games.homeTeam,
      awayTeam: games.awayTeam,
      date: games.date,
      startTime: games.startTime,
      endTime: games.endTime,
      location: games.location,
    })
    .from(games)
    .where(and(gte(games.date, afterKey), lte(games.date, beforeKey)));

  return rows.map((row) => {
    const [year, month, day] = dateKeyToParts(row.date);
    const start = rigaWallClockToUtc(year, month, day, ...timeToParts(row.startTime));
    const end = rigaWallClockToUtc(year, month, day, ...timeToParts(row.endTime));

    return {
      uid: `game-${row.id}`,
      title: `${row.homeTeam} – ${row.awayTeam}`,
      location: row.location,
      allDay: false,
      start,
      end,
      eventType: "game",
      ...formatLabels(start, false),
    };
  });
}

/**
 * Wide enough window for client-side week-by-week navigation without
 * regenerating on every "prev/next week" click.
 */
function weekBrowsingWindow() {
  const now = new Date();
  const after = new Date(now);
  after.setMonth(after.getMonth() - 2);
  const before = new Date(now);
  before.setMonth(before.getMonth() + 6);
  return { after, before };
}

/** Merges FK Olaine's admin-managed trainings, events, and games for the
 *  week-browsing calendar widget. */
export async function getScheduleForWeekBrowsing(): Promise<CalendarEvent[]> {
  const { after, before } = weekBrowsingWindow();

  const [trainingEvents, otherEvents, gameEvents] = await Promise.all([
    getAdminTrainingEvents(after, before).catch(() => []),
    getAdminEvents(after, before).catch(() => []),
    getAdminGameEvents(after, before).catch(() => []),
  ]);

  return [...trainingEvents, ...otherEvents, ...gameEvents].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
}
