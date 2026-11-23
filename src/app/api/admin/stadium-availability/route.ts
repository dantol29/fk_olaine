import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { getScheduleForRange, rigaWallClockToUtc } from "@/lib/calendar";
import { bookingsForVenueOnDay } from "@/lib/stadium-venue";

export const dynamic = "force-dynamic";
const DAY_MS = 86_400_000;
/** The longest event span the panel checks; a longer one is almost certainly a typo in the end date. */
const MAX_SPAN_DAYS = 31;

/** Noon UTC of a "YYYY-MM-DD" day, or null when it is not a real date. */
function parseDateKey(key: string): Date | null {
  const date = new Date(`${key}T12:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === key ? date : null;
}

export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  const key = request.nextUrl.searchParams.get("date") ?? "";
  const date = parseDateKey(key);
  if (!date) return NextResponse.json({ error: "Invalid date" }, { status: 400, headers });
  // A multi-day event sends its last day too, so every day it covers is checked.
  const endKey = request.nextUrl.searchParams.get("endDate") || key;
  const lastDay = parseDateKey(endKey);
  if (!lastDay || lastDay < date || lastDay.getTime() - date.getTime() > MAX_SPAN_DAYS * DAY_MS) {
    return NextResponse.json({ error: "Invalid end date" }, { status: 400, headers });
  }
  const location = request.nextUrl.searchParams.get("location") ?? "";
  if (!location.trim() || location.length > 500) return NextResponse.json({ error: "Invalid venue" }, { status: 400, headers });
  const exclude = request.nextUrl.searchParams.get("exclude");
  try {
    // Include the previous day to catch overnight bookings.
    const previous = new Date(date); previous.setUTCDate(previous.getUTCDate() - 1);
    const events = await getScheduleForRange(previous, lastDay);
    const dayStart = rigaWallClockToUtc(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), 0, 0);
    const next = new Date(lastDay); next.setUTCDate(next.getUTCDate() + 1);
    const dayEnd = rigaWallClockToUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), 0, 0);
    return NextResponse.json({ events: bookingsForVenueOnDay(events, location, dayStart, dayEnd, exclude).map((event) => ({ uid: event.uid, title: event.title, start: event.start, end: event.end })) }, { headers });
  } catch {
    return NextResponse.json({ error: "Unable to check availability" }, { status: 503, headers });
  }
}
