import { NextRequest, NextResponse } from "next/server";

import { getScheduleForRange } from "@/lib/calendar";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("date") ?? "";
  const date = new Date(`${key}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== key) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const after = new Date(date);
  after.setUTCDate(after.getUTCDate() - (after.getUTCDay() + 6) % 7);
  const before = new Date(after);
  before.setUTCDate(before.getUTCDate() + 6);

  try {
    const events = await getScheduleForRange(after, before);
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ error: "Unable to load calendar" }, { status: 500 });
  }
}
