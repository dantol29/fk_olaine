import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { games, leagueSources } from "@/db/schema";
import { scrapeFixtures } from "@/lib/fixtures";
import { isOlaine } from "@/lib/games";

import { confirmImport } from "./actions";

export default async function AdminLeagueSourceImportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sourceId = Number(id);

  const [source] = await db.select().from(leagueSources).where(eq(leagueSources.id, sourceId));
  if (!source) notFound();

  let fixtures;
  try {
    fixtures = await scrapeFixtures(source.url);
  } catch (error) {
    console.error(`Failed to fetch fixtures from ${source.url}:`, error);
    return (
      <div>
        <h1 className="mb-2 text-2xl font-extrabold text-club-navy">
          Ielādēt spēles: {source.label}
        </h1>
        <div className="rounded-xl border border-club-red/20 bg-club-red/5 p-4 text-sm text-club-red">
          Neizdevās ielādēt spēles no šī URL. Pārliecinies, ka tas ir derīgs LFF spēļu saraksta
          URL (ar norādītu &quot;Visas spēles&quot; cilni), un mēģini vēlreiz.
        </div>
      </div>
    );
  }

  const candidates = fixtures.filter(
    (fixture) => fixture.time !== null && (isOlaine(fixture.home) || isOlaine(fixture.away)),
  );

  const existingGames = await db
    .select({ date: games.date, homeTeam: games.homeTeam, awayTeam: games.awayTeam })
    .from(games)
    .where(and(eq(games.teamId, source.teamId), eq(games.source, "lff")));

  const existingKeys = new Set(existingGames.map((g) => `${g.date}|${g.homeTeam}|${g.awayTeam}`));

  const rows = candidates.map((fixture) => ({
    fixture,
    alreadyImported: existingKeys.has(`${fixture.date}|${fixture.home}|${fixture.away}`),
  }));

  const boundConfirm = confirmImport.bind(null, source.teamId, source.label);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-club-navy">
        Ielādēt spēles: {source.label}
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Atrastas {candidates.length} FK Olaine spēles. Atzīmē, kuras pievienot, un apstiprini.
      </p>

      {candidates.length === 0 ? (
        <p className="text-sm text-slate-400">
          Šajā URL neizdevās atrast nevienu FK Olaine spēli ar apstiprinātu laiku.
        </p>
      ) : (
        <form action={boundConfirm}>
          <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400">
                <th className="p-4" />
                <th className="p-4 font-semibold">Datums</th>
                <th className="p-4 font-semibold">Laiks</th>
                <th className="p-4 font-semibold">Mājinieki</th>
                <th className="p-4 font-semibold">Viesi</th>
                <th className="p-4 font-semibold">Stadions</th>
                <th className="p-4 font-semibold">Statuss</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ fixture, alreadyImported }, index) => (
                <tr key={index} className="border-b border-slate-100 last:border-0">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      name="selected"
                      disabled={alreadyImported}
                      defaultChecked={!alreadyImported}
                      value={JSON.stringify({
                        homeTeam: fixture.home,
                        awayTeam: fixture.away,
                        date: fixture.date,
                        startTime: fixture.time,
                        location: fixture.stadium || "Nav norādīts",
                      })}
                    />
                  </td>
                  <td className="p-4 text-club-navy">{fixture.date}</td>
                  <td className="p-4 text-slate-500">{fixture.time}</td>
                  <td className="p-4 text-slate-500">{fixture.home}</td>
                  <td className="p-4 text-slate-500">{fixture.away}</td>
                  <td className="p-4 text-slate-500">{fixture.stadium || "—"}</td>
                  <td className="p-4 text-slate-500">
                    {alreadyImported ? "jau importēts" : fixture.played ? "aizvadīta" : "gaidāma"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="submit"
            className="mt-6 rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
          >
            Apstiprināt
          </button>
        </form>
      )}
    </div>
  );
}
