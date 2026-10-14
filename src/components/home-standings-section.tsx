import { HomeLeagueTable } from "@/components/home-league-table";
import { getLeagueStandingsForDisplay } from "@/lib/league-standings-server";

export async function HomeStandingsSection() {
  const leagues = (await getLeagueStandingsForDisplay()).filter(
    (league) => league.id !== undefined && league.url.trim().length > 0,
  );
  if (leagues.length === 0) return null;
  return <HomeLeagueTable leagues={leagues} />;
}
