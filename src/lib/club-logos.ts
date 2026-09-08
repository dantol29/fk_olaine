import "server-only";
import { inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { clubLogos } from "@/db/schema";

/** Resolves a batch of club names to their logo image via an exact name
 *  match against club_logos — FK Olaine included, no special-casing.
 *  Returns null for any name with no matching entry (callers render an
 *  initials+color placeholder for null). One batched query handles every
 *  name at once. */
export async function resolveClubLogos(names: string[]): Promise<Map<string, string | null>> {
  const uniqueNames = [...new Set(names)];
  if (uniqueNames.length === 0) return new Map();

  const rows = await db.select().from(clubLogos).where(inArray(clubLogos.name, uniqueNames));
  const logoByName = new Map(rows.map((row) => [row.name, row.logoUrl]));

  return new Map(uniqueNames.map((name) => [name, logoByName.get(name) ?? null]));
}
