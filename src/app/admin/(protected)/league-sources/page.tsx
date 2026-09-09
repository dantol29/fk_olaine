import { eq } from "drizzle-orm";
import { Pencil } from "lucide-react";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";
import { leagueSources, teams } from "@/db/schema";

import { deleteLeagueSource } from "./actions";

export default async function AdminLeagueSourcesPage() {
  const rows = await db
    .select({
      id: leagueSources.id,
      label: leagueSources.label,
      url: leagueSources.url,
      standingsUrl: leagueSources.standingsUrl,
      displayOrder: leagueSources.displayOrder,
      teamName: teams.name,
    })
    .from(leagueSources)
    .innerJoin(teams, eq(leagueSources.teamId, teams.id))
    .orderBy(leagueSources.displayOrder, leagueSources.label);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Līgu avoti</h1>
        <Link
          href="/admin/league-sources/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Secība</th>
            <th className="p-4 font-semibold">Nosaukums</th>
            <th className="p-4 font-semibold">Komanda</th>
            <th className="p-4 font-semibold">URL</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((source) => (
            <tr key={source.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 text-slate-500">{source.displayOrder}</td>
              <td className="p-4 font-semibold text-club-navy">{source.label}</td>
              <td className="p-4 text-slate-500">{source.teamName}</td>
              <td className="max-w-xs truncate p-4 text-slate-500">{source.url}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/league-sources/${source.id}/import`}
                    className="text-sm font-semibold text-club-red hover:underline"
                  >
                    Ielādēt spēles
                  </Link>
                  {source.standingsUrl && (
                    <Link
                      href={`/admin/league-sources/${source.id}/test-standings`}
                      className="text-sm font-semibold text-club-navy hover:underline"
                    >
                      Testēt tabulu
                    </Link>
                  )}
                  <Link
                    href={`/admin/league-sources/${source.id}`}
                    aria-label={`Rediģēt līgas avotu "${source.label}"`}
                    title="Rediģēt"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton
                    action={deleteLeagueSource.bind(null, source.id)}
                    confirmMessage={`Dzēst līgas avotu "${source.label}"?`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-slate-400">
                Vēl nav neviena līgas avota.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
