import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { cronJobStatuses, leagueSources } from "@/db/schema";
import { syncLeagueSource, type ReviewNeededGame } from "@/lib/league-sync";
import { sendNotificationEmail } from "@/lib/mailer";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

/** Sends the "N games need review" email when there's anything to report.
 *  Returns the failure reason to persist in cronJobStatuses.lastEmailError,
 *  or null when either no email was needed or it sent successfully — so an
 *  SMTP problem is visible in the admin UI, not just server logs. */
async function notifyReviewNeeded(
  bySource: { id: number; label: string; reviewNeeded: ReviewNeededGame[] }[],
): Promise<string | null> {
  const withChanges = bySource.filter((source) => source.reviewNeeded.length > 0);
  const totalCount = withChanges.reduce((sum, source) => sum + source.reviewNeeded.length, 0);
  if (totalCount === 0) return null;

  const settings = await getSiteSettings();
  const lines = withChanges.flatMap((source) => [
    `${source.label} (${SITE_URL}/admin/league-sources/${source.id}/import):`,
    ...source.reviewNeeded.map((game) => {
      const changes: string[] = [];
      if (game.oldStartTime !== game.newStartTime) {
        changes.push(`laiks ${game.oldStartTime} → ${game.newStartTime}`);
      }
      if (game.oldLocation !== game.newLocation) {
        changes.push(`stadions "${game.oldLocation}" → "${game.newLocation}"`);
      }
      return `  - ${game.date} ${game.homeTeam} - ${game.awayTeam}: ${changes.join(", ")}`;
    }),
    "",
  ]);

  const result = await sendNotificationEmail({
    to: settings.email,
    subject: `FK Olaine: ${totalCount} spēlei(ēm) LFF dati atšķiras no datubāzes`,
    text: [
      `LFF sinhronizācija atrada ${totalCount} jau importētu spēli(es), kurām LFF tagad rāda citu laiku vai stadionu.`,
      "Šīs izmaiņas NAV automātiski piemērotas — apskati un apstiprini katrā līgas avota \"Ielādēt spēles\" lapā.",
      "",
      ...lines,
    ].join("\n"),
  });

  return result.sent ? null : result.error;
}

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
    set: {
      status: "running",
      startedAt,
      finishedAt: null,
      importedCount: 0,
      needsReviewCount: 0,
      message: null,
      lastEmailError: null,
    },
  });

  try {
    const sources = await db.select().from(leagueSources);
    const results = await Promise.all(
      sources.map(async (source) => ({
        id: source.id,
        label: source.label,
        ...(await syncLeagueSource(source)),
      })),
    );
    const importedCount = results.reduce((sum, result) => sum + result.imported, 0);
    const needsReviewCount = results.reduce((sum, result) => sum + result.reviewNeeded.length, 0);
    const errors = results.filter((result) => result.error);
    const finishedAt = Date.now();
    const status = errors.length === 0 ? "success" : errors.length === results.length ? "error" : "partial";
    const message = errors.length
      ? errors.map((result) => `${result.label}: ${result.error}`).join("\n")
      : null;

    const lastEmailError = await notifyReviewNeeded(results);

    await db.update(cronJobStatuses).set({
      status,
      finishedAt,
      lastSuccessAt: status === "success" ? finishedAt : undefined,
      importedCount,
      needsReviewCount,
      message,
      lastEmailError,
    }).where(eq(cronJobStatuses.job, "sync-fixtures"));

    return NextResponse.json(
      {
        status,
        recordedAt: new Date(finishedAt).toISOString(),
        importedCount,
        needsReviewCount,
        lastEmailError,
        results,
      },
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
