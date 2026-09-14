import { and, eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { games, leagueSources } from "@/db/schema";
import { backfillClubLogos } from "@/lib/club-logos";
import { scrapeFixtures } from "@/lib/fixtures";
import { isOlaine } from "@/lib/games";
import { cn } from "@/lib/utils";

import { applyLffChanges, confirmImport } from "./actions";

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
          <p>
            Neizdevās ielādēt spēles no šī URL. Pārliecinies, ka tas ir derīgs LFF spēļu saraksta
            URL — atver savu sacensību lapu lff.lv, izvēlies pareizo grupu un atver
            &quot;Visas spēles&quot; cilni, tad kopē šo URL:
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-club-red/20">
            <Image
              src="/lff-url-instructions.png"
              alt='LFF vietnē izvēlies sacensības un atver "Visas spēles" cilni, tad kopē šīs lapas URL'
              width={1200}
              height={440}
              className="w-full"
            />
          </div>
        </div>
      </div>
    );
  }

  const candidates = fixtures.filter(
    (fixture) => fixture.time !== null && (isOlaine(fixture.home) || isOlaine(fixture.away)),
  );

  // Backfill any club logos LFF has on file for the clubs seen here — skips
  // any name that already has an entry (under any of its logo's names), so
  // it never overwrites a manually uploaded logo or creates a duplicate for
  // a name the admin already merged into an existing entry. Runs for every
  // candidate, not just newly-confirmed ones, so revisiting this screen for
  // an already-fully-imported source still catches up on logos it didn't
  // have before this existed.
  const scrapedLogos = new Map<string, string>();
  for (const fixture of candidates) {
    if (fixture.homeLogo) scrapedLogos.set(fixture.home, fixture.homeLogo);
    if (fixture.awayLogo) scrapedLogos.set(fixture.away, fixture.awayLogo);
  }
  await backfillClubLogos(scrapedLogos);

  const existingGames = await db
    .select({
      id: games.id,
      date: games.date,
      homeTeam: games.homeTeam,
      awayTeam: games.awayTeam,
      startTime: games.startTime,
      location: games.location,
    })
    .from(games)
    .where(and(eq(games.teamId, source.teamId), eq(games.source, "lff")));

  const existingByKey = new Map(
    existingGames.map((g) => [`${g.date}|${g.homeTeam}|${g.awayTeam}`, g]),
  );

  const rows = candidates.map((fixture) => {
    const existing = existingByKey.get(`${fixture.date}|${fixture.home}|${fixture.away}`);
    const alreadyImported = existing !== undefined;
    const fixtureLocation = fixture.stadium || "Nav norādīts";
    const differs =
      existing !== undefined &&
      (existing.startTime !== fixture.time || existing.location !== fixtureLocation);
    return { fixture, existing, alreadyImported, differs };
  });

  const differingCount = rows.filter((row) => row.differs).length;

  const lffUpdates = rows
    .filter((row) => row.differs)
    .map((row) => ({
      id: row.existing!.id,
      startTime: row.fixture.time as string,
      location: row.fixture.stadium || "Nav norādīts",
    }));

  const boundConfirm = confirmImport.bind(null, source.teamId, source.label);
  const boundApplyLffChanges = applyLffChanges.bind(null, sourceId);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-club-navy">
        Ielādēt spēles: {source.label}
      </h1>
      <p className="mb-2 text-sm text-slate-500">
        Atrastas {candidates.length} FK Olaine spēles. Atzīmē, kuras pievienot, un apstiprini.
      </p>
      {differingCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <p>
            {differingCount} jau importētām spēlēm LFF tagad rāda citu laiku vai stadionu, nekā
            saglabāts datubāzē (veco vērtību redzi zemāk pasvītrotu).
          </p>
          <form action={boundApplyLffChanges}>
            <input type="hidden" name="updates" value={JSON.stringify(lffUpdates)} />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Piemērot LFF datus
            </button>
          </form>
        </div>
      )}

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
              {rows.map(({ fixture, existing, alreadyImported, differs }, index) => {
                const fixtureLocation = fixture.stadium || "Nav norādīts";
                const timeDiffers = existing !== undefined && existing.startTime !== fixture.time;
                const locationDiffers =
                  existing !== undefined && existing.location !== fixtureLocation;

                return (
                  <tr
                    key={index}
                    className={cn(
                      "border-b border-slate-100 last:border-0",
                      differs && "bg-amber-50/60",
                    )}
                  >
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
                          location: fixtureLocation,
                        })}
                      />
                    </td>
                    <td className="p-4 text-club-navy">{fixture.date}</td>
                    <td className="p-4 text-slate-500">
                      {timeDiffers && (
                        <span className="mr-1.5 text-slate-400 line-through">
                          {existing.startTime}
                        </span>
                      )}
                      <span className={timeDiffers ? "font-semibold text-amber-700" : undefined}>
                        {fixture.time}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{fixture.home}</td>
                    <td className="p-4 text-slate-500">{fixture.away}</td>
                    <td className="p-4 text-slate-500">
                      {locationDiffers && (
                        <span className="mr-1.5 text-slate-400 line-through">
                          {existing.location}
                        </span>
                      )}
                      <span className={locationDiffers ? "font-semibold text-amber-700" : undefined}>
                        {fixture.stadium || "—"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {differs
                        ? "jau importēts, dati atšķiras"
                        : alreadyImported
                          ? "jau importēts"
                          : fixture.played
                            ? "aizvadīta"
                            : "gaidāma"}
                    </td>
                  </tr>
                );
              })}
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
