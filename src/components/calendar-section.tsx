import { getScheduleForWeekBrowsing, type CalendarEvent } from "@/lib/calendar";
import { WeekCalendar } from "@/components/week-calendar";
import { db } from "@/db/client";
import { teams } from "@/db/schema";

export async function CalendarSection() {
  let events: CalendarEvent[] = [];
  let teamOrder: string[] = [];
  try {
    const [schedule, teamRows] = await Promise.all([
      getScheduleForWeekBrowsing(),
      db.select({ name: teams.name }).from(teams).orderBy(teams.sort, teams.name),
    ]);
    events = schedule;
    teamOrder = teamRows.map((team) => team.name);
  } catch {
    events = [];
  }

  return (
    <section id="kalendars" className="home-calendar-section scroll-mt-24 border-t border-black/10 bg-white px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
      <div className="mx-auto max-w-[1600px]">
        <WeekCalendar events={events} teamOrder={teamOrder} />
      </div>
    </section>
  );
}
