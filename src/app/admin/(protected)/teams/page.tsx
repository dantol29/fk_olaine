import { Pencil } from "lucide-react";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";
import { teams } from "@/db/schema";

import { deleteTeam } from "./actions";

export default async function AdminTeamsPage() {
  const rows = await db.select().from(teams).orderBy(teams.name);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Komandas</h1>
        <Link
          href="/admin/teams/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Nosaukums</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((team) => (
            <tr key={team.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 font-semibold text-club-navy">{team.name}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/teams/${team.id}`}
                    aria-label={`Rediģēt komandu "${team.name}"`}
                    title="Rediģēt"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton
                    action={deleteTeam.bind(null, team.id)}
                    confirmMessage={`Dzēst komandu "${team.name}"? Tiks dzēsti arī tās spēlētāji, treniņi, notikumi un spēles.`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={2} className="p-4 text-center text-slate-400">
                Vēl nav neviena komanda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
