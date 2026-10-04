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
  headerTvName: string;
  headerTvUrl: string;
  headerJoinName: string;
  headerJoinUrl: string;
  headerFederationName: string;
  headerFederationUrl: string;
};

export type HeaderLinkSettings = Pick<SiteSettings,
  "headerTvName" | "headerTvUrl" | "headerJoinName" | "headerJoinUrl" | "headerFederationName" | "headerFederationUrl"
>;

/** Default club details and header links, used to seed the row the first
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
  email: "info@fkolaine.com",
  headerTvName: "FKOLAINE TV",
  headerTvUrl: "https://www.youtube.com/c/avanakeks/videos",
  headerJoinName: "Pievienojies",
  headerJoinUrl: "#pievienojies",
  headerFederationName: "Federācija",
  headerFederationUrl: "https://lff.lv/",
};

const SETTINGS_ID = 1;

/** Editable club details and header links. Row id 1, created if missing. */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, SETTINGS_ID));
    if (row) {
      return {
        ...row,
        email:
          row.email === "info@afaolaine.lv"
            ? DEFAULT_SITE_SETTINGS.email
            : row.email,
      };
    }

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
