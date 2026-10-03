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
    <section id="kalendars" className="home-calendar-section scroll-mt-24 border-t border-black/10 bg-white px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
      <div className="mx-auto max-w-[1600px]">
        <WeekCalendar events={events} />
      </div>
    </section>
  );
}
