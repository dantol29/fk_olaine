import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db/client";
import { leagueSources } from "@/db/schema";
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

  const sources = await db.select().from(leagueSources);
  const results = await Promise.all(
    sources.map(async (source) => ({
      label: source.label,
      ...(await syncLeagueSource(source)),
    })),
  );

  return NextResponse.json({ results });
}
