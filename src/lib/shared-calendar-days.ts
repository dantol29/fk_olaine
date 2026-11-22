// AFA events can last several days (an end date was added to events in the shared database 0.1.4). FK's calendars
// place each entry on one day, by its dateKey, between its start and end on that day. So a multi-day AFA event is cut
// into one piece per Riga day: the first from its start to the end of that day, the last from midnight to its end,
// the days between whole. Each piece then fits the calendars as any one-day entry does.

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

/** The Riga days an entry covers, each with its start and end on that day; one piece for an entry within one day.
 *  A day piece ends at 23:59 rather than midnight, so calendars that read the end's clock time still see a long day. */
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
