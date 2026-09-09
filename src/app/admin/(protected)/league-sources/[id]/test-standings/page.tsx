import { eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { leagueSources } from "@/db/schema";
import { getStandings, type StandingRow } from "@/lib/standings";

export default async function AdminLeagueSourceTestStandingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sourceId = Number(id);

  const [source] = await db.select().from(leagueSources).where(eq(leagueSources.id, sourceId));
  if (!source) notFound();

  if (!source.standingsUrl) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-extrabold text-club-navy">
          Testēt tabulu: {source.label}
        </h1>
        <p className="text-sm text-slate-400">
          Šim līgas avotam nav norādīts tabulas URL.{" "}
          <Link href={`/admin/league-sources/${source.id}`} className="text-club-red hover:underline">
            Pievieno to rediģēšanas formā.
          </Link>
        </p>
      </div>
    );
  }

  let standings: StandingRow[];
  try {
    standings = await getStandings(source.standingsUrl);
  } catch (error) {
    console.error(`Failed to fetch standings from ${source.standingsUrl}:`, error);
    return (
      <div>
        <h1 className="mb-2 text-2xl font-extrabold text-club-navy">
          Testēt tabulu: {source.label}
        </h1>
        <div className="rounded-xl border border-club-red/20 bg-club-red/5 p-4 text-sm text-club-red">
          <p>
            Neizdevās ielādēt tabulu no šī URL. Pārliecinies, ka tas ir derīgs LFF sacensību
            URL — atver savu sacensību lapu lff.lv un atver &quot;Tabula&quot; cilni (nevis
            &quot;Visas spēles&quot;), tad kopē šo URL:
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-club-red/20">
            <Image
              src="/lff-url-instructions.png"
              alt='LFF vietnē atver "Tabula" cilni un kopē šīs lapas URL'
              width={1200}
              height={440}
              className="w-full"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-club-navy">
        Testēt tabulu: {source.label}
      </h1>

      {standings.length === 0 ? (
        <p className="text-sm text-slate-400">
          URL ielādējās, bet tabulā neizdevās atrast nevienu komandu. Pārbaudi, vai URL norāda
          uz &quot;Tabula&quot; cilni.
        </p>
      ) : (
        <>
          <p className="mb-6 text-sm text-slate-500">Atrastas {standings.length} komandas tabulā.</p>
          <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400">
                <th className="p-4 font-semibold">#</th>
                <th className="p-4 font-semibold">Komanda</th>
                <th className="p-4 font-semibold">Spēles</th>
                <th className="p-4 font-semibold">Punkti</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => (
                <tr key={row.pos} className="border-b border-slate-100 last:border-0">
                  <td className="p-4 text-club-navy">{row.pos}</td>
                  <td
                    className={
                      row.isOlaine
                        ? "p-4 font-semibold text-club-red"
                        : "p-4 font-semibold text-club-navy"
                    }
                  >
                    {row.team}
                  </td>
                  <td className="p-4 text-slate-500">{row.played}</td>
                  <td className="p-4 text-slate-500">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
