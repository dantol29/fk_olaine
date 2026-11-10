import { HomeLeagueTable } from "@/components/home-league-table";
import { getLeagueStandingsForDisplay } from "@/lib/league-standings-server";
import { toDateKey } from "@/lib/calendar";
import { getCombinedScheduleForRange } from "@/lib/shared-calendar";

export async function HomeStandingsSection() {
  const today = toDateKey(new Date());
  const year = Number(today.slice(0, 4));
  const [allLeagues, schedule] = await Promise.all([
    getLeagueStandingsForDisplay(),
    getCombinedScheduleForRange(new Date(Date.UTC(year - 1, 0, 1)), new Date(Date.UTC(year + 1, 11, 31, 12)), "public"),
  ]);
  const leagues = allLeagues.filter(
    (league) => league.id !== undefined && league.url.trim().length > 0,
  );
  return <HomeLeagueTable leagues={leagues} schedule={schedule} today={today} minMonth={`${year - 1}-01`} maxMonth={`${year + 1}-12`} />;
}
