import type { GameListItem } from "@/lib/games-server";
import type { LeagueStandings } from "@/lib/league-standings-server";

export function leagueForGame(game: GameListItem, leagues: LeagueStandings[]) {
  if (game.leagueSourceId == null) return undefined;
  return leagues.find((league) => league.id === game.leagueSourceId);
}
