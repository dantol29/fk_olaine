import { eq } from "drizzle-orm";
import { Pencil } from "lucide-react";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";
import { teams, trainings } from "@/db/schema";

import { deleteTraining } from "./actions";

export default async function AdminTrainingsPage() {
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
    .orderBy(trainings.date, trainings.startTime);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Treniņi</h1>
        <Link
          href="/admin/trainings/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Datums</th>
            <th className="p-4 font-semibold">Laiks</th>
            <th className="p-4 font-semibold">Komanda</th>
            <th className="p-4 font-semibold">Vieta</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((training) => (
            <tr key={training.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 text-club-navy">{training.date}</td>
              <td className="p-4 text-slate-500">
                {training.startTime}–{training.endTime}
              </td>
              <td className="p-4 font-semibold text-club-navy">{training.teamName}</td>
              <td className="p-4 text-slate-500">{training.location}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/trainings/${training.id}`}
                    aria-label={`Rediģēt treniņu ${training.date}`}
                    title="Rediģēt"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
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
              <td colSpan={5} className="p-4 text-center text-slate-400">
                Vēl nav neviena treniņa.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
