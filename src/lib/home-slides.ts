import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { siteSettings } from "@/db/schema";

/** The shared settings field contains one homepage image URL per line. */
export function parseHomeSlides(value: string | null | undefined): string[] {
  return (value ?? "").split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
}

export async function getHomeSlides(): Promise<string[]> {
  const [row] = await db.select({ images: siteSettings.sakumlapasAtteli })
    .from(siteSettings).where(eq(siteSettings.id, 1));
  return parseHomeSlides(row?.images);
}
