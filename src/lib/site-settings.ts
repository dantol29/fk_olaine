import "server-only";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { siteSettings } from "@/db/schema";

export type SiteSettings = {
  legalName: string;
  legalAddress: string;
  regNr: string;
  bankName: string;
  bankAccount: string;
  bankCode: string;
  stadiumAddress: string;
  phone: string;
  email: string;
};

/** Current live footer content, used to seed the singleton row the first
 *  time this is read (and as a safety net if the DB read fails). */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  legalName: 'Biedrība "Futbola klubs Olaine"',
  legalAddress: "Parka 11 - 16, Olaine, Olaines novads, LV-2114",
  regNr: "50008130491",
  bankName: 'AS "Swedbank"',
  bankAccount: "LV44HABA0551028093917",
  bankCode: "HABALV22",
  stadiumAddress: "Zeiferta 4, Olaine",
  phone: "+371 29332883",
  email: "info@afaolaine.lv",
};

const SETTINGS_ID = 1;

/** The club's editable legal/bank/contact details shown in the site
 *  footer. Singleton — always row id 1, created on first read if missing. */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, SETTINGS_ID));
    if (row) return row;

    await db.insert(siteSettings).values({
      id: SETTINGS_ID,
      ...DEFAULT_SITE_SETTINGS,
      updatedAt: Date.now(),
    });
    return DEFAULT_SITE_SETTINGS;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}
