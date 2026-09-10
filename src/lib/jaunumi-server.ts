import "server-only";
import { cache } from "react";
import { desc, eq, ne } from "drizzle-orm";

import { db } from "@/db/client";
import { articles } from "@/db/schema";
import { formatArticleDate, type Article } from "@/lib/jaunumi";

type ArticleRow = typeof articles.$inferSelect;
type AuthorCoach =
  | { name: string; position: string; photoUrl: string | null }
  | null
  | undefined;

function rowToArticle(row: ArticleRow, teamName: string | null, authorCoach: AuthorCoach): Article {
  const highlights = row.highlights?.split("\n").filter(Boolean);
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    date: formatArticleDate(row.date),
    category: row.category,
    team: teamName ?? undefined,
    image: row.image,
    authorName: authorCoach?.name ?? undefined,
    authorPosition: authorCoach?.position ?? undefined,
    authorAvatar: authorCoach?.photoUrl ?? undefined,
    body: row.body.split("\n").filter(Boolean),
    quote: row.quoteText
      ? { text: row.quoteText, author: row.quoteAuthor ?? "", role: row.quoteRole ?? "" }
      : undefined,
    highlights: highlights && highlights.length > 0 ? highlights : undefined,
  };
}

/** All articles for the /jaunumi directory, newest first. */
export async function getArticles(): Promise<Article[]> {
  const rows = await db.query.articles.findMany({
    with: { team: true, authorCoach: true },
    orderBy: [desc(articles.date), desc(articles.createdAt)],
  });
  return rows.map((row) => rowToArticle(row, row.team?.name ?? null, row.authorCoach));
}

/** Cached per-request so generateMetadata and the page body share one
 *  DB lookup instead of querying the same article twice. */
export const getArticleBySlug = cache(
  async (slug: string): Promise<Article | null> => {
    const row = await db.query.articles.findFirst({
      where: eq(articles.slug, slug),
      with: { team: true, authorCoach: true },
    });
    return row ? rowToArticle(row, row.team?.name ?? null, row.authorCoach) : null;
  },
);

/** Other recent articles shown on an article detail page. */
export async function getRelatedArticles(
  excludeSlug: string,
  limit = 4,
): Promise<{ slug: string; title: string; date: string; image: string }[]> {
  const rows = await db.query.articles.findMany({
    where: ne(articles.slug, excludeSlug),
    orderBy: [desc(articles.date), desc(articles.createdAt)],
    limit,
  });
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    date: formatArticleDate(row.date),
    image: row.image,
  }));
}
