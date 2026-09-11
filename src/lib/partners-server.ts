import "server-only";
import { asc } from "drizzle-orm";

import { db } from "@/db/client";
import { partners } from "@/db/schema";

export type Partner = typeof partners.$inferSelect;

/** All partners, in display order — shared by the homepage marquee and
 *  the site footer. */
export async function getPartners(): Promise<Partner[]> {
  return db.select().from(partners).orderBy(asc(partners.id));
}
