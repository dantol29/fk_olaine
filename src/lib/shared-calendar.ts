import "server-only";
import { createHash } from "node:crypto";

import { getScheduleForRange, toDateKey, type CalendarEvent } from "@/lib/calendar";

export type SharedCalendarStatus = "ok" | "unconfigured" | "unavailable" | "stale";
export type CombinedSchedule = { events: CalendarEvent[]; sharedStatus: SharedCalendarStatus; sharedError?: string; sharedUpdatedAt?: string };
class FeedError extends Error {}

const label = new Intl.DateTimeFormat("lv-LV", { timeZone: "Europe/Riga", hour: "2-digit", minute: "2-digit" });

function parseEvent(value: unknown, from: string, to: string): CalendarEvent {
  if (!value || typeof value !== "object") throw new FeedError("AFA kalendārā ir notikums ar nederīgu datumu, laiku vai datiem.");
  const row = value as Record<string, unknown>;
  const start = new Date(String(row.start));
  const end = new Date(String(row.end));
  if (typeof row.uid !== "string" || !/^afa-olaine:(game|training|event)-[0-9]+$/.test(row.uid)
    || typeof row.title !== "string" || typeof row.dateKey !== "string"
    || row.dateKey < from || row.dateKey > to || !Number.isFinite(start.getTime())
    || !Number.isFinite(end.getTime()) || end <= start || toDateKey(start) !== row.dateKey
    || !["game", "training", "other"].includes(String(row.eventType))
    || (row.location !== null && typeof row.location !== "string")
    || (row.team !== null && typeof row.team !== "string")) throw new FeedError("AFA kalendārā ir notikums ar nederīgu datumu, laiku vai datiem.");
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

type ImportedSchedule = { events: CalendarEvent[]; status: SharedCalendarStatus; error?: string; updatedAt?: string };
const PUBLIC_CACHE_MS = 60_000;
const FAILURE_RETRY_MS = 10_000;
const MAX_CACHE_ENTRIES = 16;
type CacheEntry = { lastGood?: ImportedSchedule; loadedAt: number; attemptedAt: number; result: ImportedSchedule };
// Public display cache only. Each Node process owns its cache; admin bypasses it.
const publicCache = new Map<string, CacheEntry>();
const pendingPublicRequests = new Map<string, Promise<ImportedSchedule>>();

async function publicImportedSchedule(after: Date, before: Date): Promise<ImportedSchedule> {
  if (!process.env.AFA_CALENDAR_URL || !process.env.SHARED_CALENDAR_SECRET) return importedSchedule(after, before);
  // Keep credentials out of cache keys and invalidate if the connection changes.
  const connection = createHash("sha256").update(process.env.AFA_CALENDAR_URL).update("\0").update(process.env.SHARED_CALENDAR_SECRET).digest("hex");
  const key = `${connection}:${toDateKey(after)}:${toDateKey(before)}`;
  const previous = publicCache.get(key);
  const now = Date.now();
  if (previous?.result.status === "ok" && now - previous.loadedAt < PUBLIC_CACHE_MS) return previous.result;
  if (previous && previous.result.status !== "ok" && now - previous.attemptedAt < FAILURE_RETRY_MS) return previous.result;
  const pending = pendingPublicRequests.get(key);
  if (pending) return pending;

  const request = (async () => {
    const fresh = await importedSchedule(after, before);
    const finishedAt = Date.now();
    const lastGood = fresh.status === "ok" ? { ...fresh, updatedAt: new Date(finishedAt).toISOString() } : previous?.lastGood;
    const result: ImportedSchedule = fresh.status === "ok" ? lastGood!
      : lastGood ? { ...lastGood, status: "stale", error: fresh.error } : fresh;
    publicCache.delete(key);
    publicCache.set(key, { lastGood, loadedAt: fresh.status === "ok" ? finishedAt : previous?.loadedAt ?? 0, attemptedAt: finishedAt, result });
    while (publicCache.size > MAX_CACHE_ENTRIES) {
      const oldest = publicCache.keys().next().value;
      if (oldest !== undefined) publicCache.delete(oldest);
    }
    return result;
  })();
  pendingPublicRequests.set(key, request);
  try { return await request; } finally { pendingPublicRequests.delete(key); }
}

async function importedSchedule(after: Date, before: Date): Promise<ImportedSchedule> {
  const configured = process.env.AFA_CALENDAR_URL;
  const secret = process.env.SHARED_CALENDAR_SECRET;
  if (!configured || !secret) return { events: [], status: "unconfigured", error: "AFA kalendāra savienojums vēl nav konfigurēts." };
  try {
    const base = new URL(configured);
    if (!["https:", "http:"].includes(base.protocol) || base.username || base.password) throw new FeedError("AFA kalendāra adrese nav derīga.");
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
      const response = await fetch(url, { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(4000) });
      if (!response.ok) {
        const reason = response.status >= 300 && response.status < 400 ? "Adrese pāradresē uz citu lapu. Jāizmanto tiešā AFA lietotnes adrese."
          : response.status === 401 || response.status === 403 ? "Savienojumam nav piešķirta piekļuve."
          : response.status === 404 ? "AFA kalendāra pakalpojums šajā adresē nav atrasts."
          : response.status === 503 ? "AFA kalendāra pakalpojums pašlaik nav pieejams."
          : "AFA kalendāra pieprasījums neizdevās.";
        throw new FeedError(`HTTP ${response.status}: ${reason}`);
      }
      if (!response.headers.get("content-type")?.includes("application/json")) throw new FeedError("AFA adrese atgrieza tīmekļa lapu, nevis kalendāra datus.");
      let data: unknown;
      try { data = await response.json(); } catch { throw new FeedError("AFA kalendāra atbilde nav derīga."); }
      if (!data || typeof data !== "object") throw new FeedError("AFA kalendāra atbildes formāts nav derīgs.");
      const payload = data as Record<string, unknown>;
      if (payload.version !== 1 || payload.club !== "AFA Olaine" || !Array.isArray(payload.events)) throw new FeedError("AFA kalendāra atbildes formāts nav derīgs.");
      return payload.events.map((event) => parseEvent(event, range.from, range.to));
    }));
    const events = [...new Map(chunks.flat().map((event) => [event.uid, event])).values()];
    return { events, status: "ok" };
  } catch (error) {
    // Only pass controlled messages to the UI; never expose URLs or secrets.
    const detail = error instanceof FeedError ? error.message
      : error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)
      ? "AFA kalendārs neatbildēja 4 sekunžu laikā."
      : "Neizdevās savienoties ar AFA kalendāru. Pārbaudiet pakalpojuma adresi un savienojumu.";
    console.error("AFA shared calendar could not be loaded:", detail);
    return { events: [], status: "unavailable", error: detail };
  }
}

export async function getCombinedScheduleForRange(after: Date, before: Date, mode: "fresh" | "public" = "fresh"): Promise<CombinedSchedule> {
  const [local, shared] = await Promise.all([getScheduleForRange(after, before), mode === "public" ? publicImportedSchedule(after, before) : importedSchedule(after, before)]);
  return {
    events: [...local.map((event) => ({ ...event, club: "FK Olaine" as const, readOnly: false })), ...shared.events]
      .sort((a, b) => a.start.getTime() - b.start.getTime()),
    sharedStatus: shared.status,
    sharedError: shared.error,
    sharedUpdatedAt: shared.updatedAt,
  };
}
