"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";

const SETTINGS_ID = 1;

function parseSettingsInput(formData: FormData) {
  const legalName = String(formData.get("legalName") ?? "").trim();
  const legalAddress = String(formData.get("legalAddress") ?? "").trim();
  const regNr = String(formData.get("regNr") ?? "").trim();
  const bankName = String(formData.get("bankName") ?? "").trim();
  const bankAccount = String(formData.get("bankAccount") ?? "").trim();
  const bankCode = String(formData.get("bankCode") ?? "").trim();
  const stadiumAddress = String(formData.get("stadiumAddress") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const headerLinks = {
    headerTvName: String(formData.get("headerTvName") ?? "").trim(),
    headerTvUrl: String(formData.get("headerTvUrl") ?? "").trim(),
    headerJoinName: String(formData.get("headerJoinName") ?? "").trim(),
    headerJoinUrl: String(formData.get("headerJoinUrl") ?? "").trim(),
    headerFederationName: String(formData.get("headerFederationName") ?? "").trim(),
    headerFederationUrl: String(formData.get("headerFederationUrl") ?? "").trim(),
  };

  for (const [name, url] of [
    [headerLinks.headerTvName, headerLinks.headerTvUrl],
    [headerLinks.headerJoinName, headerLinks.headerJoinUrl],
    [headerLinks.headerFederationName, headerLinks.headerFederationUrl],
  ]) {
    if (!name || name.length > 80) return { error: "Pogas nosaukumam jābūt no 1 līdz 80 rakstzīmēm." } as const;
    if (!isValidHeaderLink(url)) return { error: `Pogai “${name}” norādi derīgu saiti (https://…, /kontakti vai #pievienojies).` } as const;
  }

  if (!legalName) return { error: "Biedrības nosaukums ir obligāts." } as const;
  if (!legalAddress) return { error: "Juridiskā adrese ir obligāta." } as const;
  if (!regNr) return { error: "Reģistrācijas numurs ir obligāts." } as const;
  if (!bankName) return { error: "Bankas nosaukums ir obligāts." } as const;
  if (!bankAccount) return { error: "Konta numurs ir obligāts." } as const;
  if (!bankCode) return { error: "Bankas kods ir obligāts." } as const;
  if (!stadiumAddress) return { error: "Stadiona adrese ir obligāta." } as const;
  if (!phone) return { error: "Tālrunis ir obligāts." } as const;
  if (!email) return { error: "E-pasts ir obligāts." } as const;

  return {
    legalName,
    legalAddress,
    regNr,
    bankName,
    bankAccount,
    bankCode,
    stadiumAddress,
    phone,
    email,
    ...headerLinks,
  } as const;
}

function isValidHeaderLink(value: string) {
  if (!value || /[\s\\\u0000-\u001f\u007f]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("#") && value.length > 1) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export async function updateSiteSettings(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  await requireAdminSession();

  const parsed = parseSettingsInput(formData);
  if ("error" in parsed) return parsed;

  await db
    .insert(siteSettings)
    .values({ id: SETTINGS_ID, ...parsed, updatedAt: Date.now() })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { ...parsed, updatedAt: Date.now() },
    });

  // Refresh shared header links and club details across public pages.
  revalidatePath("/", "layout");
  revalidatePath("/admin/site-settings");

  return { success: true } as const;
}
