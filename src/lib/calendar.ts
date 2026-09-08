import { and, eq, gte, lte } from "drizzle-orm";

import { db } from "@/db/client";
import { events, games, teams, trainings } from "@/db/schema";

import { getAllFixtures, type Fixture } from "./fixtures";
import type { Competition } from "./standings";

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
  /** "calendar" = FK Olaine's own recurring training schedule.
   *  "fixture" = pulled from the official LFF match schedule. */
  source: "calendar" | "fixture";
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

function toDateKey(date: Date): string {
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

function fixtureToCalendarEvent(fixture: Fixture): CalendarEvent | null {
  const match = fixture.time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const dayDate = new Date(fixture.sortKey);
  const start = rigaWallClockToUtc(
    dayDate.getUTCFullYear(),
    dayDate.getUTCMonth() + 1,
    dayDate.getUTCDate(),
    Number(match[1]),
    Number(match[2]),
  );
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const { weekdayLabel, dateLabel, timeLabel, dayLabel, monthLabel, dateKey } =
    formatLabels(start, false);

  return {
    uid: `fixture-${fixture.home}-${fixture.away}-${fixture.sortKey}`,
    title: `${fixture.home} – ${fixture.away}`,
    location: fixture.stadium || null,
    allDay: false,
    start,
    end,
    dateKey,
    weekdayLabel,
    dateLabel,
    timeLabel,
    dayLabel,
    monthLabel,
    source: "fixture",
    eventType: "game",
  };
}

/** FK Olaine's own upcoming/played matches, pulled from the LFF schedule. */
export async function getClubFixtureEvents(): Promise<CalendarEvent[]> {
  const competitions: Competition[] = ["sieviesu-liga", "1-liga", "u16"];
  const results = await Promise.allSettled(
    competitions.map((competition) => getAllFixtures(competition)),
  );

  const fixtures = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  return fixtures
    .filter((fixture) => fixture.isOlaine)
    .map(fixtureToCalendarEvent)
    .filter((event): event is CalendarEvent => event !== null);
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
      source: "calendar",
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
      source: "calendar",
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
      opponent: games.opponent,
      date: games.date,
      startTime: games.startTime,
      endTime: games.endTime,
      homeAway: games.homeAway,
      location: games.location,
      teamName: teams.name,
    })
    .from(games)
    .innerJoin(teams, eq(games.teamId, teams.id))
    .where(and(gte(games.date, afterKey), lte(games.date, beforeKey)));

  return rows.map((row) => {
    const [year, month, day] = dateKeyToParts(row.date);
    const start = rigaWallClockToUtc(year, month, day, ...timeToParts(row.startTime));
    const end = rigaWallClockToUtc(year, month, day, ...timeToParts(row.endTime));
    const opponentLabel =
      row.homeAway === "home"
        ? `${row.teamName} – ${row.opponent}`
        : `${row.opponent} – ${row.teamName}`;

    return {
      uid: `game-${row.id}`,
      title: opponentLabel,
      location: row.location,
      allDay: false,
      start,
      end,
      source: "calendar",
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

/** Merges FK Olaine's own training schedule with its official match
 *  fixtures, for the week-browsing calendar widget. */
export async function getScheduleForWeekBrowsing(): Promise<CalendarEvent[]> {
  const { after, before } = weekBrowsingWindow();

  const [fixtureEvents, trainingEvents, otherEvents, gameEvents] = await Promise.all([
    getClubFixtureEvents().catch(() => []),
    getAdminTrainingEvents(after, before).catch(() => []),
    getAdminEvents(after, before).catch(() => []),
    getAdminGameEvents(after, before).catch(() => []),
  ]);

  return [...fixtureEvents, ...trainingEvents, ...otherEvents, ...gameEvents].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
}
