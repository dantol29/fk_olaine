import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { getScheduleForRange, rigaWallClockToUtc } from "@/lib/calendar";
import { bookingsForVenueOnDay } from "@/lib/stadium-venue";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  const key = request.nextUrl.searchParams.get("date") ?? "";
  const date = new Date(`${key}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== key) return NextResponse.json({ error: "Invalid date" }, { status: 400, headers });
  const location = request.nextUrl.searchParams.get("location") ?? "";
  if (!location.trim() || location.length > 500) return NextResponse.json({ error: "Invalid venue" }, { status: 400, headers });
  const exclude = request.nextUrl.searchParams.get("exclude");
  try {
    // Include the previous day to catch overnight bookings.
    const previous = new Date(date); previous.setUTCDate(previous.getUTCDate() - 1);
    const events = await getScheduleForRange(previous, date);
    const dayStart = rigaWallClockToUtc(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), 0, 0);
    const next = new Date(date); next.setUTCDate(next.getUTCDate() + 1);
    const dayEnd = rigaWallClockToUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), 0, 0);
    return NextResponse.json({ events: bookingsForVenueOnDay(events, location, dayStart, dayEnd, exclude).map((event) => ({ uid: event.uid, title: event.title, start: event.start, end: event.end })) }, { headers });
  } catch {
    return NextResponse.json({ error: "Unable to check availability" }, { status: 503, headers });
  }
}
