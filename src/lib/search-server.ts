import "server-only";

import { like, or } from "drizzle-orm";

import { db } from "@/db/client";
import { articles, coaches, players, teams } from "@/db/schema";

const RESULT_LIMIT = 5;

export type SearchResults = {
  articles: { slug: string; title: string; excerpt: string; image: string }[];
  players: { id: number; name: string; photoUrl: string | null; teamName: string | null }[];
  coaches: {
    id: number;
    name: string;
    position: string;
    photoUrl: string | null;
    license: string;
    authority: "UEFA" | "LFF";
  }[];
  teams: { id: number; name: string }[];
};

const EMPTY_RESULTS: SearchResults = { articles: [], players: [], coaches: [], teams: [] };

/** Simple case-insensitive substring search across the site's public
 *  content — players, coaches, teams, and news articles. Good enough for
 *  a club site's content volume; no need for a real search index. */
export async function searchSite(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (q.length < 2) return EMPTY_RESULTS;

  const pattern = `%${q}%`;

  const [articleRows, playerRows, coachRows, teamRows] = await Promise.all([
    db.query.articles.findMany({
      where: or(like(articles.title, pattern), like(articles.excerpt, pattern)),
      orderBy: (articles, { desc }) => [desc(articles.date)],
      limit: RESULT_LIMIT,
    }),
    db.query.players.findMany({
      where: like(players.name, pattern),
      with: { playerTeams: { with: { team: true } } },
      limit: RESULT_LIMIT,
    }),
    db.query.coaches.findMany({
      where: like(coaches.name, pattern),
      limit: RESULT_LIMIT,
    }),
    db.query.teams.findMany({
      where: like(teams.name, pattern),
      limit: RESULT_LIMIT,
    }),
  ]);

  return {
    articles: articleRows.map((article) => ({
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      image: article.image,
    })),
    players: playerRows.map((player) => ({
      id: player.id,
      name: player.name,
      photoUrl: player.photoUrl,
      teamName: player.playerTeams[0]?.team.name ?? null,
    })),
    coaches: coachRows.map((coach) => ({
      id: coach.id,
      name: coach.name,
      position: coach.position,
      photoUrl: coach.photoUrl,
      license: coach.license,
      authority: coach.authority,
    })),
    teams: teamRows.map((team) => ({ id: team.id, name: team.name })),
  };
}
