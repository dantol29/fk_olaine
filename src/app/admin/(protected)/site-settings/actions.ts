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
  } as const;
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

  // The footer renders on every public page via the root layout.
  revalidatePath("/", "layout");

  return { success: true } as const;
}
