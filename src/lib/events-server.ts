import "server-only";

import { desc, eq } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db/client";
import { eventTeams, events, teams } from "@/db/schema";
import { eventPath } from "@/lib/events";

export type EventTeam = { id: number; name: string; sort: number };

function compareTeams(a: EventTeam, b: EventTeam) {
  return a.sort - b.sort || a.name.localeCompare(b.name, "lv");
}

/** Teams per event, in the club's team order. Events with no team are absent from the map. */
export async function getTeamsByEvent(): Promise<Map<number, EventTeam[]>> {
  const rows = await db
    .select({ eventId: eventTeams.eventId, id: teams.id, name: teams.name, sort: teams.sort })
    .from(eventTeams)
    .innerJoin(teams, eq(eventTeams.teamId, teams.id));
  const teamsByEvent = new Map<number, EventTeam[]>();
  for (const { eventId, ...team } of rows) teamsByEvent.set(eventId, [...(teamsByEvent.get(eventId) ?? []), team]);
  for (const list of teamsByEvent.values()) list.sort(compareTeams);
  return teamsByEvent;
}

export type PublicEvent = {
  id: number;
  title: string;
  date: string;
  endDate: string | null;
  startTime: string;
  endTime: string;
  location: string;
  /** Sanitized when saved; null when there is none. */
  description: string | null;
  image: string | null;
  gallery: string[];
  teams: { id: number; name: string }[];
  path: string;
};

type EventRow = Omit<typeof events.$inferSelect, "notes" | "createdAt">;

function toPublicEvent(row: EventRow, teamList: EventTeam[]): PublicEvent {
  const { gallery, ...fields } = row;
  return {
    ...fields,
    gallery: gallery?.split("\n").filter(Boolean) ?? [],
    teams: teamList.map(({ id, name }) => ({ id, name })),
    path: eventPath(row.id, row.title),
  };
}

const PUBLIC_COLUMNS = { notes: false, createdAt: false } as const;

/** Every event for the public "Notikumi" page, latest date first; the admin's private notes are not read. */
export const getPublicEvents = cache(async function getPublicEvents(): Promise<PublicEvent[]> {
  const [rows, teamsByEvent] = await Promise.all([
    db.query.events.findMany({ columns: PUBLIC_COLUMNS, orderBy: [desc(events.date), desc(events.startTime)] }),
    getTeamsByEvent(),
  ]);
  return rows.map((row) => toPublicEvent(row, teamsByEvent.get(row.id) ?? []));
});

/** One event for its public page. */
export const getPublicEvent = cache(async function getPublicEvent(id: number): Promise<PublicEvent | null> {
  const row = await db.query.events.findFirst({ where: eq(events.id, id), columns: PUBLIC_COLUMNS });
  if (!row) return null;
  return toPublicEvent(row, (await getTeamsByEvent()).get(id) ?? []);
});
