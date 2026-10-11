import { CalendarDirectory } from "@/components/calendar-directory";
import { requireAdminSession } from "@/lib/auth";
import { toDateKey } from "@/lib/calendar";
import { getCombinedScheduleForRange } from "@/lib/shared-calendar";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  await requireAdminSession();
  const today = toDateKey(new Date());
  const year = Number(today.slice(0, 4));
  const schedule = await getCombinedScheduleForRange(new Date(Date.UTC(year - 1, 0, 1, 12)), new Date(Date.UTC(year + 1, 11, 31, 12)));
  const names = [...new Set(schedule.events.flatMap((event) => event.team ? [event.team] : []))].sort((a, b) => a.localeCompare(b, "lv"));
  return <CalendarDirectory events={schedule.events} sharedStatus={schedule.sharedStatus} teamOptions={names.map((name, id) => ({ name, id }))} today={today} minMonth={`${year - 1}-01`} maxMonth={`${year + 1}-12`} admin />;
}
