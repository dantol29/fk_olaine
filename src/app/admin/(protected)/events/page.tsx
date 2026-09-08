import { eq } from "drizzle-orm";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
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
        <h1 className="text-2xl font-extrabold text-club-navy">Notikumi</h1>
        <Link
          href="/admin/events/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Nosaukums</th>
            <th className="p-4 font-semibold">Datums</th>
            <th className="p-4 font-semibold">Laiks</th>
            <th className="p-4 font-semibold">Komanda</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((event) => (
            <tr key={event.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 font-semibold text-club-navy">{event.title}</td>
              <td className="p-4 text-club-navy">{event.date}</td>
              <td className="p-4 text-slate-500">
                {event.startTime}–{event.endTime}
              </td>
              <td className="p-4 text-slate-500">{event.teamName ?? "Viss klubs"}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="text-sm font-semibold text-club-navy hover:underline"
                  >
                    Rediģēt
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
              <td colSpan={5} className="p-4 text-center text-slate-400">
                Vēl nav neviena notikuma.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
