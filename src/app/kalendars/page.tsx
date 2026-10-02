import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CalendarDirectory } from "@/components/calendar-directory";
import { getScheduleForRange, toDateKey } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kalendārs",
  description: "FK Olaine spēļu, treniņu un pasākumu kalendārs.",
  alternates: { canonical: "/kalendars" },
};

export default async function KalendarsPage() {
  const today = toDateKey(new Date());
  const year = Number(today.slice(0, 4));
  const events = await getScheduleForRange(new Date(Date.UTC(year - 1, 0, 1)), new Date(Date.UTC(year + 1, 11, 31, 12)));
  return <><SiteHeader /><main className="bg-white"><CalendarDirectory events={events} today={today} minMonth={`${year - 1}-01`} maxMonth={`${year + 1}-12`} /></main><SiteFooter /></>;
}
