import { CalendarDirectory } from "@/components/calendar-directory";
import { db } from "@/db/client";
import { teams } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { getScheduleForRange, toDateKey } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  await requireAdminSession();
  const today = toDateKey(new Date());
  const year = Number(today.slice(0, 4));
  const [events, teamOptions] = await Promise.all([
    getScheduleForRange(new Date(Date.UTC(year - 1, 0, 1, 12)), new Date(Date.UTC(year + 1, 11, 31, 12))),
    db.select({ id: teams.id, name: teams.name }).from(teams).orderBy(teams.sort, teams.name),
  ]);
  return <CalendarDirectory events={events} teamOptions={teamOptions} today={today} minMonth={`${year - 1}-01`} maxMonth={`${year + 1}-12`} admin />;
}
