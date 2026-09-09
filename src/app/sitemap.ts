import type { MetadataRoute } from "next";

import { db } from "@/db/client";
import { articles } from "@/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/komandas`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/treneri`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/jaunumi`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/klubs/stadions`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const rows = await db.select({ slug: articles.slug, createdAt: articles.createdAt }).from(articles);
  const articleRoutes: MetadataRoute.Sitemap = rows.map((row) => ({
    url: `${siteUrl}/jaunumi/${row.slug}`,
    lastModified: new Date(row.createdAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
