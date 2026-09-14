import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { clubPages } from "@/db/schema";

export async function getPublishedClubPages() {
  return db
    .select({
      title: clubPages.title,
      slug: clubPages.slug,
      description: clubPages.description,
      body: clubPages.body,
      updatedAt: clubPages.updatedAt,
    })
    .from(clubPages)
    .where(eq(clubPages.isPublished, true))
    .orderBy(asc(clubPages.displayOrder), asc(clubPages.title));
}
