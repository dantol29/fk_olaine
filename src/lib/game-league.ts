import type { GameListItem } from "@/lib/games-server";
import type { LeagueStandings } from "@/lib/league-standings-server";

export function leagueForGame(game: GameListItem, leagues: LeagueStandings[]) {
  const normalize = (value: string) => value.trim().toLocaleLowerCase("lv");
  const teamLeagues = leagues.filter((league) => league.teamName && normalize(league.teamName) === normalize(game.teamName));
  const labelMatches = leagues.filter((league) => normalize(league.label) === normalize(game.league ?? ""));
  return teamLeagues.find((league) => normalize(league.label) === normalize(game.league ?? ""))
    ?? (labelMatches.length === 1 ? labelMatches[0] : undefined)
    ?? (teamLeagues.length === 1 ? teamLeagues[0] : undefined);
}
