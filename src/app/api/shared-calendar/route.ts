import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { getScheduleForRange } from "@/lib/calendar";
import { buildSharedFkFeed } from "@/lib/shared-calendar-export";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };
const MAX_RANGE_DAYS = 365;
const DAY_MS = 86_400_000;

function parseDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  // Noon UTC stays on the same calendar date in Europe/Riga.
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

function hash(value: string) {
  return createHash("sha256").update(value).digest();
}

/** FK's bookings for AFA Olaine, the mirror of AFA's own /api/shared-calendar that FK reads. AFA uses them to warn
 *  about venue clashes; it does not store them. Bookings are those starting from `from` to `to`, inclusive. */
export async function GET(request: NextRequest) {
  const secret = process.env.SHARED_CALENDAR_SECRET;
  if (!secret) return NextResponse.json({ error: "Shared calendar is not configured" }, { status: 503, headers });

  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token || !timingSafeEqual(hash(token), hash(secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  const from = parseDate(request.nextUrl.searchParams.get("from"));
  const to = parseDate(request.nextUrl.searchParams.get("to"));
  if (!from || !to || to < from || to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY_MS) {
    return NextResponse.json({ error: "Provide from and to dates (YYYY-MM-DD), with a range of at most 366 days" }, { status: 400, headers });
  }

  try {
    const schedule = await getScheduleForRange(from, to);
    return NextResponse.json(buildSharedFkFeed(schedule, getSiteUrl(), new Date()), { headers });
  } catch (error) {
    console.error("Unable to load shared calendar", error);
    return NextResponse.json({ error: "Unable to load calendar" }, { status: 503, headers });
  }
}
