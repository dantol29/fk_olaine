import { NextRequest, NextResponse } from "next/server";
import { eq, isNotNull } from "drizzle-orm";

import { db } from "@/db/client";
import { cronJobStatuses, leagueSources } from "@/db/schema";
import { syncTopScorersForSource } from "@/lib/top-scorers-sync";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

/** Hit on a schedule to refresh every league source's FK Olaine players'
 *  `goals` count from LFF's goal-scorers page — see syncTopScorersForSource.
 *  Requires `?secret=` matching CRON_SECRET, same as sync-fixtures. Reuses
 *  the `importedCount` cronJobStatuses column to mean "players updated"
 *  for this job. */
async function runSync(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const secret = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const startedAt = Date.now();
  await db.insert(cronJobStatuses).values({
    job: "sync-top-scorers",
    status: "running",
    startedAt,
  }).onConflictDoUpdate({
    target: cronJobStatuses.job,
    set: { status: "running", startedAt, finishedAt: null, importedCount: 0, message: null },
  });

  try {
    const sources = await db
      .select()
      .from(leagueSources)
      .where(isNotNull(leagueSources.topScorersUrl));

    const results = await Promise.all(
      sources.map(async (source) => ({
        label: source.label,
        ...(await syncTopScorersForSource({
          teamId: source.teamId,
          topScorersUrl: source.topScorersUrl as string,
        })),
      })),
    );
    const updatedCount = results.reduce((sum, result) => sum + result.updated, 0);
    const errors = results.filter((result) => result.error);
    const finishedAt = Date.now();
    const status = errors.length === 0 ? "success" : errors.length === results.length ? "error" : "partial";
    const message = errors.length
      ? errors.map((result) => `${result.label}: ${result.error}`).join("\n")
      : null;

    await db.update(cronJobStatuses).set({
      status,
      finishedAt,
      lastSuccessAt: status === "success" ? finishedAt : undefined,
      importedCount: updatedCount,
      message,
    }).where(eq(cronJobStatuses.job, "sync-top-scorers"));

    return NextResponse.json(
      { status, recordedAt: new Date(finishedAt).toISOString(), updatedCount, results },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.update(cronJobStatuses).set({
      status: "error",
      finishedAt: Date.now(),
      message,
    }).where(eq(cronJobStatuses.job, "sync-top-scorers"));
    return NextResponse.json(
      { status: "error", recordedAt: new Date().toISOString(), error: message },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

export const GET = runSync;
export const POST = runSync;
