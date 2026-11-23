import { richTextHasContent, sanitizeRichText } from "@/lib/rich-text";
import { slugify } from "@/lib/slug";

// An event lasts from `date` startTime to `endDate` endTime. `endDate` is null for a one-day event (shared database
// 0.1.4), so a one-day event has one form. Teams are in event_teams; an event without teams belongs to no team (it
// may be a town event that only takes a place) and is left out of team filters.

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^(\d{2}):(\d{2})$/;
/** Longest description kept, in characters of cleaned HTML. */
export const MAX_DESCRIPTION_LENGTH = 30_000;

function minutes(time: string): number | null {
  const match = TIME.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** The stored end date: null when empty or the start date. */
export function storedEndDate(date: string, endDate: string | null | undefined): string | null {
  const value = endDate?.trim() ?? "";
  return value === "" || value === date ? null : value;
}

/** Why the dates and times cannot be saved, or null when they can. Over several days the end time may be earlier
 *  than the start time (it is on another day). */
export function eventDatesProblem(date: string, startTime: string, endDate: string | null, endTime: string): string | null {
  if (endDate === null) {
    const start = minutes(startTime);
    const end = minutes(endTime);
    return start !== null && end !== null && end > start ? null : "Beigu laikam jābūt vēlāk par sākuma laiku (tajā pašā dienā).";
  }
  if (!DATE_KEY.test(endDate) || Number.isNaN(Date.parse(`${endDate}T12:00:00Z`))) return "Beigu datums nav derīgs.";
  if (endDate < date) return "Beigu datums nevar būt pirms sākuma datuma.";
  return null;
}

/** The ticked teams of a form, each once, in id order. */
export function parseTeamIds(formData: FormData): number[] {
  return [...new Set(formData.getAll("teamIds").map(Number))].filter((id) => Number.isInteger(id) && id > 0).sort((a, b) => a - b);
}

export function parseEventInput(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  // Sent only while "Vairākas dienas" is ticked.
  const endDate = storedEndDate(date, String(formData.get("endDate") ?? ""));
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const rawDescription = String(formData.get("description") ?? "");

  if (!title) return { error: "Nosaukums ir obligāts." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (!startTime) return { error: "Sākuma laiks ir obligāts." } as const;
  if (!endTime) return { error: "Beigu laiks ir obligāts." } as const;
  const datesProblem = eventDatesProblem(date, startTime, endDate, endTime);
  if (datesProblem) return { error: datesProblem } as const;
  if (!location) return { error: "Vieta ir obligāta." } as const;
  if (rawDescription.length > 2 * MAX_DESCRIPTION_LENGTH) return { error: "Apraksts ir pārāk garš." } as const;
  const description = sanitizeRichText(rawDescription);
  if (description.length > MAX_DESCRIPTION_LENGTH) return { error: "Apraksts ir pārāk garš." } as const;

  return {
    title,
    date,
    startTime,
    endDate,
    endTime,
    location,
    notes: notes || null,
    // An editor left with only empty paragraphs counts as no description.
    description: richTextHasContent(description) ? description : null,
    teamIds: parseTeamIds(formData),
  } as const;
}

function dayMonth(date: string): string {
  return `${date.slice(8, 10)}.${date.slice(5, 7)}.`;
}

function fullDate(date: string): string {
  return `${dayMonth(date)}${date.slice(0, 4)}`;
}

/** When an event happens, each end with its own time: "12.12.2026 10:00–16:00" for one day, "05.12. 10:00 –
 *  07.12.2026 16:00" for several days of one year, both years when it crosses a new year. */
export function formatEventSpan(date: string, startTime: string, endDate: string | null, endTime: string): string {
  if (!endDate) return `${fullDate(date)} ${startTime}–${endTime}`;
  const first = endDate.slice(0, 4) === date.slice(0, 4) ? dayMonth(date) : fullDate(date);
  return `${first} ${startTime} – ${fullDate(endDate)} ${endTime}`;
}

const FALLBACK_SLUG = "notikums";

/** /notikumi/<title in Latin letters>-<id>: the id finds the event, so two events with one title never share an
 *  address, and an address with an old title still opens the event (the page moves to the current address). */
export function eventSlug(id: number, title: string): string {
  return `${slugify(title) || FALLBACK_SLUG}-${id}`;
}

export function eventPath(id: number, title: string): string {
  return `/notikumi/${eventSlug(id, title)}`;
}

/** The event id at the end of an address slug, or null when there is none. */
export function eventIdFromSlug(slug: string): number | null {
  const match = /(?:^|-)(\d+)$/.exec(slug);
  const id = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const DAY_KEY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Riga", year: "numeric", month: "2-digit", day: "2-digit" });
const LAST_MINUTE_MS = 60_000;

export function rigaDateKey(date: Date): string {
  return DAY_KEY.format(date);
}

function nextDateKey(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** The instant a Riga day starts, whatever the daylight-saving offset. */
export function rigaMidnight(dateKey: string): Date {
  const guess = new Date(`${dateKey}T00:00:00Z`);
  for (const offsetHours of [2, 3, 1, 4]) {
    const candidate = new Date(guess.getTime() - offsetHours * 3_600_000);
    if (rigaDateKey(candidate) === dateKey && rigaDateKey(new Date(candidate.getTime() - 1)) !== dateKey) return candidate;
  }
  return guess;
}

export type DayPiece = { dateKey: string; start: Date; end: Date; part: number; parts: number };

/** The calendars place each entry on one day, so a multi-day event is cut into one piece per Riga day: the first
 *  from its start to the end of that day, the last from midnight to its end, the days between whole. A day piece
 *  ends at 23:59 rather than midnight, so calendars that read the end's clock time still see a long day. */
export function splitIntoDays(start: Date, end: Date): DayPiece[] {
  const lastDay = rigaDateKey(new Date(end.getTime() - 1));
  const firstDay = rigaDateKey(start);
  if (lastDay <= firstDay) return [{ dateKey: firstDay, start, end, part: 1, parts: 1 }];
  const days: string[] = [];
  for (let day = firstDay; day <= lastDay; day = nextDateKey(day)) days.push(day);
  return days.map((dateKey, index) => ({
    dateKey,
    start: index === 0 ? start : rigaMidnight(dateKey),
    end: index === days.length - 1 ? end : new Date(rigaMidnight(nextDateKey(dateKey)).getTime() - LAST_MINUTE_MS),
    part: index + 1,
    parts: days.length,
  }));
}
