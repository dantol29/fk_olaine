import { Pencil } from "lucide-react";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";

import { deleteCoach } from "./actions";

export default async function AdminCoachesPage() {
  const rows = await db.query.coaches.findMany({
    with: { coachTeams: { with: { team: true } } },
    orderBy: (coaches, { asc }) => [asc(coaches.name)],
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Treneri</h1>
        <Link
          href="/admin/coaches/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Vārds, uzvārds</th>
            <th className="p-4 font-semibold">Amats</th>
            <th className="p-4 font-semibold">Komandas</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((coach) => (
            <tr key={coach.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 font-semibold text-club-navy">{coach.name}</td>
              <td className="p-4 text-slate-500">{coach.position}</td>
              <td className="p-4 text-slate-500">
                {coach.coachTeams.map((ct) => ct.team.name).join(", ") || "—"}
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/coaches/${coach.id}`}
                    aria-label={`Rediģēt treneri "${coach.name}"`}
                    title="Rediģēt"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton
                    action={deleteCoach.bind(null, coach.id)}
                    confirmMessage={`Dzēst treneri "${coach.name}"?`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-slate-400">
                Vēl nav neviena trenera.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
