import { Pencil } from "lucide-react";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { AdminSearch } from "@/components/admin/admin-search";
import { db } from "@/db/client";
import { toDateKey } from "@/lib/calendar";

import { deleteTraining } from "./actions";

export default async function AdminTrainingsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const archived = (await searchParams).view === "archive";
  const now = new Date();
  const today = toDateKey(now);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Riga", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(now);
  const rows = await db.query.trainings.findMany({
    where: (table, { and, or, lt, lte, gt, eq }) => archived
      ? or(lt(table.date, today), and(eq(table.date, today), lte(table.endTime, time)))
      : or(gt(table.date, today), and(eq(table.date, today), gt(table.endTime, time))),
    with: { trainingTeams: { with: { team: true } }, trainingCoaches: { with: { coach: true } } },
    orderBy: (table, { asc, desc }) => archived
      ? [desc(table.date), desc(table.startTime)]
      : [asc(table.date), asc(table.startTime)],
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black">Treniņi</h1>
        <Link
          href="/admin/trainings/new"
          className="rounded-none bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>
      <nav aria-label="Treniņu saraksts" className="mb-4 flex gap-4 text-sm">
        <Link href="/admin/trainings" aria-current={!archived ? "page" : undefined}
          className={!archived ? "font-semibold text-club-red underline" : "text-black/55 hover:text-black"}>Aktuālie treniņi</Link>
        <Link href="/admin/trainings?view=archive" aria-current={archived ? "page" : undefined}
          className={archived ? "font-semibold text-club-red underline" : "text-black/55 hover:text-black"}>Arhīvs</Link>
      </nav>
      <AdminSearch placeholder="Meklēt treniņus…" />

      <table className="w-full overflow-hidden rounded-none bg-white text-left text-sm shadow-none">
        <thead>
          <tr className="border-b border-black/15 text-black/45">
            <th className="p-4 font-semibold">Datums</th>
            <th className="p-4 font-semibold">Laiks</th>
            <th className="p-4 font-semibold">Komandas</th>
            <th className="p-4 font-semibold">Treneri</th>
            <th className="p-4 font-semibold">Vieta</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((training) => (
            <tr data-admin-search-item={`${training.date} ${training.startTime} ${training.trainingTeams.map((item) => item.team.name).join(" ")} ${training.trainingCoaches.map((tc) => tc.coach?.name).join(" ")} ${training.location}`} key={training.id} className="border-b border-black/10 last:border-0">
              <td className="p-4 text-black">{training.date}</td>
              <td className="p-4 text-black/55">
                {training.startTime}–{training.endTime}
              </td>
              <td className="p-4 font-semibold text-black">{training.trainingTeams.map((item) => item.team.name).join(", ") || "—"}</td>
              <td className="p-4 text-black/55">
                {training.trainingCoaches.map((tc) => tc.coach?.name).join(", ") || "—"}
              </td>
              <td className="p-4 text-black/55">{training.location}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/trainings/${training.id}`}
                    aria-label={`Rediģēt treniņu ${training.date}`}
                    title="Rediģēt"
                    className="flex h-8 w-8 items-center justify-center rounded-none text-black transition hover:bg-[#f5f5f5]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton
                    action={deleteTraining.bind(null, training.id)}
                    confirmMessage="Dzēst šo treniņu?"
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-black/45">
                {archived ? "Arhīvā nav treniņu." : "Nav aktuālu treniņu."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
