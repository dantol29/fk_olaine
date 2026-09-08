import "server-only";
import { inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { clubLogos } from "@/db/schema";
import { isOlaine } from "@/lib/games";

const OLAINE_CREST = "/fk-olaine-crest-v2.png";

/** Resolves a batch of club names to their logo image — FK Olaine's own
 *  crest, an admin-managed opponent logo, or null if neither matches
 *  (callers render an initials+color placeholder for null). One batched
 *  query handles every non-Olaine name at once, so calling this with a
 *  whole list of games' home/away names is a single round trip. */
export async function resolveClubLogos(names: string[]): Promise<Map<string, string | null>> {
  const uniqueNames = [...new Set(names)];
  const nonOlaineNames = uniqueNames.filter((name) => !isOlaine(name));

  const rows =
    nonOlaineNames.length > 0
      ? await db.select().from(clubLogos).where(inArray(clubLogos.name, nonOlaineNames))
      : [];
  const logoByName = new Map(rows.map((row) => [row.name, row.logoUrl]));

  return new Map(
    uniqueNames.map((name) => [
      name,
      isOlaine(name) ? OLAINE_CREST : (logoByName.get(name) ?? null),
    ]),
  );
}
