import "server-only";
import { eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { clubLogoNames, clubLogos } from "@/db/schema";

/** Resolves a batch of club names to their logo image via an exact name
 *  match against club_logo_names — FK Olaine included, no special-casing.
 *  A logo can be known by several names (the same club is often spelled
 *  differently across competitions), so this joins through the names
 *  table rather than matching on club_logos directly. Returns null for
 *  any name with no matching entry (callers render an initials+color
 *  placeholder for null). One batched query handles every name at once. */
export async function resolveClubLogos(names: string[]): Promise<Map<string, string | null>> {
  const uniqueNames = [...new Set(names)];
  if (uniqueNames.length === 0) return new Map();

  const rows = await db
    .select({ name: clubLogoNames.name, logoUrl: clubLogos.logoUrl })
    .from(clubLogoNames)
    .innerJoin(clubLogos, eq(clubLogoNames.clubLogoId, clubLogos.id))
    .where(inArray(clubLogoNames.name, uniqueNames));
  const logoByName = new Map(rows.map((row) => [row.name, row.logoUrl]));

  return new Map(uniqueNames.map((name) => [name, logoByName.get(name) ?? null]));
}
