import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { articles, clubPages } from "@/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/komandas`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/treneri`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/speles`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/treninji`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/jaunumi`, changeFrequency: "daily", priority: 0.8 },
  ];

  const [rows, pageRows] = await Promise.all([
    db.select({ slug: articles.slug, createdAt: articles.createdAt }).from(articles),
    db.select({ slug: clubPages.slug, updatedAt: clubPages.updatedAt })
      .from(clubPages)
      .where(eq(clubPages.isPublished, true)),
  ]);
  const articleRoutes: MetadataRoute.Sitemap = rows.map((row) => ({
    url: `${siteUrl}/jaunumi/${row.slug}`,
    lastModified: new Date(row.createdAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const clubPageRoutes: MetadataRoute.Sitemap = pageRows.map((row) => ({
    url: `${siteUrl}/klubs/${row.slug}`,
    lastModified: new Date(row.updatedAt),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...articleRoutes, ...clubPageRoutes];
}
