import type { CalendarEvent } from "@/lib/calendar";

/** FK's own bookings as AFA Olaine reads them (docs/shared-calendar.md, "FK feed for AFA"). Only these fields leave
 *  FK: the drawer data (gameFixture, trainingFixture with coaches) and labels stay private. */
export type SharedFkEvent = {
  uid: string;
  club: "FK Olaine";
  readOnly: true;
  title: string;
  location: string | null;
  allDay: boolean;
  start: string;
  end: string;
  dateKey: string;
  eventType: CalendarEvent["eventType"];
  team: string | null;
  teamNames?: string[];
  homeTeam?: string;
  awayTeam?: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
};

export type SharedFkFeed = { version: 1; club: "FK Olaine"; timezone: "Europe/Riga"; generatedAt: string; events: SharedFkEvent[] };

const UID = /^(game|training|event)-[0-9]+$/;

function absoluteLogo(value: string | null | undefined, siteUrl: string) {
  if (!value) return null;
  try {
    const url = new URL(value, `${siteUrl}/`);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/** A booking AFA could not place on its calendar (an invalid time, or one that ends before it starts) is left out and
 *  logged, so one bad entry does not hide the rest of the schedule. */
function isShareable(event: CalendarEvent): boolean {
  const start = event.start.getTime();
  const end = event.end.getTime();
  const reason = !UID.test(event.uid) ? "unexpected id"
    : !Number.isFinite(start) || !Number.isFinite(end) ? "invalid start or end"
    : end <= start ? "end is not after start" : null;
  if (reason) console.warn(`Shared calendar: skipped fk-olaine:${event.uid}: ${reason}`);
  return reason === null;
}

export function buildSharedFkFeed(events: CalendarEvent[], siteUrl: string, generatedAt: Date): SharedFkFeed {
  return {
    version: 1,
    club: "FK Olaine",
    timezone: "Europe/Riga",
    generatedAt: generatedAt.toISOString(),
    events: events.filter(isShareable).map((event) => ({
      uid: `fk-olaine:${event.uid}`,
      club: "FK Olaine",
      readOnly: true,
      title: event.title,
      location: event.location,
      allDay: event.allDay,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      dateKey: event.dateKey,
      eventType: event.eventType,
      team: event.team,
      ...(event.teamNames ? { teamNames: event.teamNames } : {}),
      ...(event.eventType === "game"
        ? {
            homeTeam: event.homeTeam,
            awayTeam: event.awayTeam,
            homeLogo: absoluteLogo(event.homeLogo, siteUrl),
            awayLogo: absoluteLogo(event.awayLogo, siteUrl),
          }
        : {}),
    })),
  };
}
