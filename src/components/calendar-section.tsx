import { getScheduleForWeekBrowsing, type CalendarEvent } from "@/lib/calendar";
import { WeekCalendar } from "@/components/week-calendar";

export async function CalendarSection() {
  let events: CalendarEvent[] = [];
  try {
    events = await getScheduleForWeekBrowsing();
  } catch {
    events = [];
  }

  return (
    <section className="px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-[1440px]">
        <WeekCalendar events={events} />
      </div>
    </section>
  );
}
