import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { cronJobStatuses, leagueSources } from "@/db/schema";
import { syncLeagueSource } from "@/lib/league-sync";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

/** Hit on a schedule (e.g. a daily cPanel Cron Job) to pull in any new
 *  fixtures for every league source, with no admin review step — see
 *  syncLeagueSource. Requires `?secret=` matching CRON_SECRET so this
 *  isn't a public, unauthenticated way to write to the database. */
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
    job: "sync-fixtures",
    status: "running",
    startedAt,
  }).onConflictDoUpdate({
    target: cronJobStatuses.job,
    set: { status: "running", startedAt, finishedAt: null, importedCount: 0, message: null },
  });

  try {
    const sources = await db.select().from(leagueSources);
    const results = await Promise.all(
      sources.map(async (source) => ({
        label: source.label,
        ...(await syncLeagueSource(source)),
      })),
    );
    const importedCount = results.reduce((sum, result) => sum + result.imported, 0);
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
      importedCount,
      message,
    }).where(eq(cronJobStatuses.job, "sync-fixtures"));

    return NextResponse.json(
      { status, recordedAt: new Date(finishedAt).toISOString(), importedCount, results },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.update(cronJobStatuses).set({
      status: "error",
      finishedAt: Date.now(),
      message,
    }).where(eq(cronJobStatuses.job, "sync-fixtures"));
    return NextResponse.json(
      { status: "error", recordedAt: new Date().toISOString(), error: message },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

// GET remains available for existing cron configurations. POST is preferred
// because hosting/CDN caches cannot replay a previous successful response.
export const GET = runSync;
export const POST = runSync;
