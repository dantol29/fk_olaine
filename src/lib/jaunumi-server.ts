import "server-only";
import { cache } from "react";
import { desc, eq, ne } from "drizzle-orm";

import { db } from "@/db/client";
import { articles } from "@/db/schema";
import { formatArticleDate, type Article } from "@/lib/jaunumi";

type ArticleRow = typeof articles.$inferSelect;

function rowToArticle(row: ArticleRow, teamName: string | null): Article {
  const highlights = row.highlights?.split("\n").filter(Boolean);
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    date: formatArticleDate(row.date),
    category: row.category,
    team: teamName ?? undefined,
    image: row.image,
    body: row.body.split("\n").filter(Boolean),
    quote: row.quoteText
      ? { text: row.quoteText, author: row.quoteAuthor ?? "", role: row.quoteRole ?? "" }
      : undefined,
    highlights: highlights && highlights.length > 0 ? highlights : undefined,
    closing: row.closing ?? undefined,
    signature: row.signature ?? undefined,
  };
}

/** All articles for the /jaunumi directory, newest first. */
export async function getArticles(): Promise<Article[]> {
  const rows = await db.query.articles.findMany({
    with: { team: true },
    orderBy: [desc(articles.date), desc(articles.createdAt)],
  });
  return rows.map((row) => rowToArticle(row, row.team?.name ?? null));
}

/** Cached per-request so generateMetadata and the page body share one
 *  DB lookup instead of querying the same article twice. */
export const getArticleBySlug = cache(
  async (slug: string): Promise<Article | null> => {
    const row = await db.query.articles.findFirst({
      where: eq(articles.slug, slug),
      with: { team: true },
    });
    return row ? rowToArticle(row, row.team?.name ?? null) : null;
  },
);

/** Sidebar "Izceltie raksti" list — articles the admin flagged as featured. */
export async function getFeaturedArticles(
  limit = 4,
): Promise<{ title: string; date: string; image: string }[]> {
  const rows = await db.query.articles.findMany({
    where: eq(articles.featured, true),
    orderBy: [desc(articles.date), desc(articles.createdAt)],
    limit,
  });
  return rows.map((row) => ({
    title: row.title,
    date: formatArticleDate(row.date),
    image: row.image,
  }));
}

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
