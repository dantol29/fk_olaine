import { eq } from "drizzle-orm";
import { Pencil } from "lucide-react";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { AdminSearch } from "@/components/admin/admin-search";
import { db } from "@/db/client";
import { events, teams } from "@/db/schema";

import { deleteEvent } from "./actions";

export default async function AdminEventsPage() {
  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      date: events.date,
      startTime: events.startTime,
      endTime: events.endTime,
      teamName: teams.name,
    })
    .from(events)
    .leftJoin(teams, eq(events.teamId, teams.id))
    .orderBy(events.date);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black">Notikumi</h1>
        <Link
          href="/admin/events/new"
          className="rounded-none bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>
      <AdminSearch placeholder="Meklēt notikumus…" />

      <table className="w-full overflow-hidden rounded-none bg-white text-left text-sm shadow-none">
        <thead>
          <tr className="border-b border-black/15 text-black/45">
            <th className="p-4 font-semibold">Nosaukums</th>
            <th className="p-4 font-semibold">Datums</th>
            <th className="p-4 font-semibold">Laiks</th>
            <th className="p-4 font-semibold">Komanda</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((event) => (
            <tr data-admin-search-item={`${event.title} ${event.date} ${event.startTime} ${event.teamName ?? "Viss klubs"}`} key={event.id} className="border-b border-black/10 last:border-0">
              <td className="p-4 font-semibold text-black">{event.title}</td>
              <td className="p-4 text-black">{event.date}</td>
              <td className="p-4 text-black/55">
                {event.startTime}–{event.endTime}
              </td>
              <td className="p-4 text-black/55">{event.teamName ?? "Viss klubs"}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/events/${event.id}`}
                    aria-label={`Rediģēt notikumu "${event.title}"`}
                    title="Rediģēt"
                    className="flex h-8 w-8 items-center justify-center rounded-none text-black transition hover:bg-[#f5f5f5]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton
                    action={deleteEvent.bind(null, event.id)}
                    confirmMessage={`Dzēst notikumu "${event.title}"?`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-black/45">
                Vēl nav neviena notikuma.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
