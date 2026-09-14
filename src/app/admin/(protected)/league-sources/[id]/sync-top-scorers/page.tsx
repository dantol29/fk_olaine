import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { leagueSources } from "@/db/schema";
import { syncTopScorersForSource } from "@/lib/top-scorers-sync";

export default async function AdminLeagueSourceSyncTopScorersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sourceId = Number(id);

  const [source] = await db.select().from(leagueSources).where(eq(leagueSources.id, sourceId));
  if (!source) notFound();

  if (!source.topScorersUrl) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-extrabold text-club-navy">
          Sinhronizēt vārtu guvējus: {source.label}
        </h1>
        <p className="text-sm text-slate-400">
          Šim līgas avotam nav norādīts vārtu guvēju URL.{" "}
          <Link href={`/admin/league-sources/${source.id}`} className="text-club-red hover:underline">
            Pievieno to rediģēšanas formā.
          </Link>
        </p>
      </div>
    );
  }

  const result = await syncTopScorersForSource({
    teamId: source.teamId,
    topScorersUrl: source.topScorersUrl,
  });

  if (result.updated > 0) {
    revalidatePath("/");
    revalidatePath("/komandas");
  }

  if (result.error) {
    console.error(`Failed to fetch top scorers from ${source.topScorersUrl}:`, result.error);
    return (
      <div>
        <h1 className="mb-2 text-2xl font-extrabold text-club-navy">
          Sinhronizēt vārtu guvējus: {source.label}
        </h1>
        <div className="rounded-xl border border-club-red/20 bg-club-red/5 p-4 text-sm text-club-red">
          <p>
            Neizdevās ielādēt vārtu guvējus no šī URL. Pārliecinies, ka tas ir derīgs LFF
            sacensību URL — atver savu sacensību lapu lff.lv un atver &quot;Vārtu guvēji&quot;
            cilni, tad kopē šo URL.
          </p>
          <p className="mt-3 font-mono text-xs break-all text-club-red/70">{result.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-club-navy">
        Sinhronizēt vārtu guvējus: {source.label}
      </h1>

      {result.details.length === 0 ? (
        <p className="text-sm text-slate-400">
          URL ielādējās, bet sarakstā neizdevās atrast nevienu FK Olaine spēlētāju. Pārbaudi, vai
          URL norāda uz &quot;Vārtu guvēji&quot; cilni.
        </p>
      ) : (
        <>
          <p className="mb-6 text-sm text-slate-500">
            Atrasti {result.details.length} FK Olaine spēlētāji LFF sarakstā, atjaunināti{" "}
            {result.updated}.
          </p>
          <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400">
                <th className="p-4 font-semibold">Spēlētājs</th>
                <th className="p-4 font-semibold">Klubs (LFF)</th>
                <th className="p-4 font-semibold">Vārti (LFF)</th>
                <th className="p-4 font-semibold">Statuss</th>
              </tr>
            </thead>
            <tbody>
              {result.details.map((detail) => (
                <tr key={detail.name} className="border-b border-slate-100 last:border-0">
                  <td className="p-4 font-semibold text-club-navy">{detail.name}</td>
                  <td className="p-4 text-slate-500">{detail.club}</td>
                  <td className="p-4 text-slate-500">{detail.goals}</td>
                  <td className="p-4">
                    {detail.matchedPlayerId === null ? (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                        Nav atrasts komandā
                      </span>
                    ) : detail.previousGoals === detail.goals ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                        Bez izmaiņām
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        Atjaunināts ({detail.previousGoals} → {detail.goals})
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
