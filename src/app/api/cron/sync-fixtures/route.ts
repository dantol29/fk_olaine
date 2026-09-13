import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { cronJobStatuses, leagueSources } from "@/db/schema";
import { syncLeagueSource } from "@/lib/league-sync";

/** Hit on a schedule (e.g. a daily cPanel Cron Job) to pull in any new
 *  fixtures for every league source, with no admin review step — see
 *  syncLeagueSource. Requires `?secret=` matching CRON_SECRET so this
 *  isn't a public, unauthenticated way to write to the database. */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.update(cronJobStatuses).set({
      status: "error",
      finishedAt: Date.now(),
      message,
    }).where(eq(cronJobStatuses.job, "sync-fixtures"));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
