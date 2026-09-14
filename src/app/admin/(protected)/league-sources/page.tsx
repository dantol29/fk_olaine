import { eq } from "drizzle-orm";
import { Pencil } from "lucide-react";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { AdminSearch } from "@/components/admin/admin-search";
import { db } from "@/db/client";
import { cronJobStatuses, leagueSources, teams } from "@/db/schema";

import { deleteLeagueSource } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLeagueSourcesPage() {
  const [rows, [cronStatus]] = await Promise.all([
    db
      .select({
        id: leagueSources.id,
        label: leagueSources.label,
        url: leagueSources.url,
        standingsUrl: leagueSources.standingsUrl,
        topScorersUrl: leagueSources.topScorersUrl,
        displayOrder: leagueSources.displayOrder,
        teamName: teams.name,
      })
      .from(leagueSources)
      .innerJoin(teams, eq(leagueSources.teamId, teams.id))
      .orderBy(leagueSources.displayOrder, leagueSources.label),
    db.select().from(cronJobStatuses).where(eq(cronJobStatuses.job, "sync-fixtures")),
  ]);

  const statusLabels = {
    running: "Notiek sinhronizācija",
    success: "Veiksmīgi",
    partial: "Daļēji veiksmīgi",
    error: "Neizdevās",
  } as const;
  const statusColors = {
    running: "bg-blue-50 text-blue-700",
    success: "bg-emerald-50 text-emerald-700",
    partial: "bg-amber-50 text-amber-700",
    error: "bg-red-50 text-red-700",
  } as const;
  const formatDate = (timestamp: number | null) => timestamp
    ? new Intl.DateTimeFormat("lv-LV", {
        dateStyle: "medium",
        timeStyle: "medium",
        timeZone: "Europe/Riga",
      }).format(new Date(timestamp))
    : "—";

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
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-club-navy">Pēdējā automātiskā LFF sinhronizācija</p>
            <p className="mt-1 text-sm text-slate-500">
              {cronStatus ? formatDate(cronStatus.finishedAt ?? cronStatus.startedAt) : "Cron vēl nav palaists"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {cronStatus && cronStatus.needsReviewCount > 0 && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                {cronStatus.needsReviewCount} spēles jāpārskata
              </span>
            )}
            {cronStatus && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[cronStatus.status]}`}>
                {statusLabels[cronStatus.status]}
              </span>
            )}
          </div>
        </div>
        {cronStatus && (
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>Importētas spēles: {cronStatus.importedCount}</span>
            <span>Pēdējā pilnībā veiksmīgā reize: {formatDate(cronStatus.lastSuccessAt)}</span>
          </div>
        )}
        {cronStatus && cronStatus.needsReviewCount > 0 && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
            LFF tagad rāda citu laiku vai stadionu {cronStatus.needsReviewCount} jau importētai
            spēlei — pārskati un piemēro izmaiņas attiecīgā līgas avota &quot;Ielādēt
            spēles&quot; ekrānā (zemāk).
          </p>
        )}
        {cronStatus?.message && (
          <p className="mt-3 whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-xs text-red-700">
            {cronStatus.message}
          </p>
        )}
      </div>
      <AdminSearch placeholder="Meklēt līgu avotus…" />

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
            <tr data-admin-search-item={`${source.label} ${source.teamName} ${source.url} ${source.standingsUrl ?? ""} ${source.topScorersUrl ?? ""}`} key={source.id} className="border-b border-slate-100 last:border-0">
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
                  {source.topScorersUrl && (
                    <Link
                      href={`/admin/league-sources/${source.id}/sync-top-scorers`}
                      className="text-sm font-semibold text-club-navy hover:underline"
                    >
                      Sinhronizēt vārtu guvējus
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
