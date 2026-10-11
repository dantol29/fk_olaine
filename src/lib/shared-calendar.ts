import "server-only";

import { getScheduleForRange, toDateKey, type CalendarEvent } from "@/lib/calendar";

export type SharedCalendarStatus = "ok" | "unconfigured" | "unavailable";
export type CombinedSchedule = { events: CalendarEvent[]; sharedStatus: SharedCalendarStatus };
const label = new Intl.DateTimeFormat("lv-LV", { timeZone: "Europe/Riga", hour: "2-digit", minute: "2-digit" });

function parseEvent(value: unknown, from: string, to: string): CalendarEvent {
  if (!value || typeof value !== "object") throw new Error("Invalid calendar event");
  const row = value as Record<string, unknown>;
  const start = new Date(String(row.start));
  const end = new Date(String(row.end));
  if (typeof row.uid !== "string" || !/^afa-olaine:(game|training|event)-[0-9]+$/.test(row.uid)
    || typeof row.title !== "string" || typeof row.dateKey !== "string"
    || row.dateKey < from || row.dateKey > to || !Number.isFinite(start.getTime())
    || !Number.isFinite(end.getTime()) || end <= start || toDateKey(start) !== row.dateKey
    || !["game", "training", "other"].includes(String(row.eventType))
    || (row.location !== null && typeof row.location !== "string")
    || (row.team !== null && typeof row.team !== "string")) throw new Error("Invalid calendar event");
  const date = new Intl.DateTimeFormat("lv-LV", { timeZone: "Europe/Riga", day: "2-digit", month: "2-digit", year: "numeric" }).format(start);
  return {
    uid: row.uid, title: row.title, location: row.location as string | null,
    start, end, dateKey: row.dateKey, allDay: row.allDay === true,
    eventType: row.eventType as CalendarEvent["eventType"], team: row.team as string | null,
    club: "AFA Olaine", readOnly: true,
    weekdayLabel: new Intl.DateTimeFormat("lv-LV", { timeZone: "Europe/Riga", weekday: "long" }).format(start),
    dateLabel: date, timeLabel: label.format(start),
    dayLabel: new Intl.DateTimeFormat("lv-LV", { timeZone: "Europe/Riga", day: "2-digit" }).format(start),
    monthLabel: new Intl.DateTimeFormat("lv-LV", { timeZone: "Europe/Riga", month: "short" }).format(start),
  };
}

async function importedSchedule(after: Date, before: Date): Promise<{ events: CalendarEvent[]; status: SharedCalendarStatus }> {
  const configured = process.env.AFA_CALENDAR_URL;
  const secret = process.env.SHARED_CALENDAR_SECRET;
  if (!configured || !secret) return { events: [], status: "unconfigured" };
  try {
    const base = new URL(configured);
    if (!["https:", "http:"].includes(base.protocol) || base.username || base.password) throw new Error("Invalid feed URL");
    const from = toDateKey(after), to = toDateKey(before);
    const ranges: { from: string; to: string }[] = [];
    let cursor = new Date(`${from}T12:00:00Z`);
    while (cursor.toISOString().slice(0, 10) <= to) {
      const end = new Date(cursor); end.setUTCDate(end.getUTCDate() + 365);
      const rangeTo = end.toISOString().slice(0, 10) < to ? end.toISOString().slice(0, 10) : to;
      ranges.push({ from: cursor.toISOString().slice(0, 10), to: rangeTo });
      cursor = new Date(`${rangeTo}T12:00:00Z`); cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    const chunks = await Promise.all(ranges.map(async (range) => {
      const url = new URL(base); url.searchParams.set("from", range.from); url.searchParams.set("to", range.to);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(4000) });
      if (!response.ok) throw new Error(`Feed returned ${response.status}`);
      const data: unknown = await response.json();
      if (!data || typeof data !== "object") throw new Error("Invalid feed response");
      const payload = data as Record<string, unknown>;
      if (payload.version !== 1 || payload.club !== "AFA Olaine" || !Array.isArray(payload.events)) throw new Error("Invalid feed response");
      return payload.events.map((event) => parseEvent(event, range.from, range.to));
    }));
    const events = [...new Map(chunks.flat().map((event) => [event.uid, event])).values()];
    return { events, status: "ok" };
  } catch {
    // Never log URLs or authorization headers containing server secrets.
    console.error("AFA shared calendar could not be loaded");
    return { events: [], status: "unavailable" };
  }
}

export async function getCombinedScheduleForRange(after: Date, before: Date): Promise<CombinedSchedule> {
  const [local, shared] = await Promise.all([getScheduleForRange(after, before), importedSchedule(after, before)]);
  return {
    events: [...local.map((event) => ({ ...event, club: "FK Olaine" as const, readOnly: false })), ...shared.events]
      .sort((a, b) => a.start.getTime() - b.start.getTime()),
    sharedStatus: shared.status,
  };
}
