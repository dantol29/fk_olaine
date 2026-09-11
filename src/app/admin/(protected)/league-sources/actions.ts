"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { leagueSources } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";

function parseLeagueSourceInput(formData: FormData) {
  const teamId = Number(formData.get("teamId"));
  const label = String(formData.get("label") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const standingsUrl = String(formData.get("standingsUrl") ?? "").trim();
  const displayOrderRaw = String(formData.get("displayOrder") ?? "").trim();
  const displayOrder = displayOrderRaw ? Number(displayOrderRaw) : 0;

  if (!teamId) return { error: "Jāizvēlas komanda." } as const;
  if (!label) return { error: "Nosaukums ir obligāts." } as const;
  if (!url) return { error: "URL ir obligāts." } as const;
  if (!Number.isInteger(displayOrder)) return { error: "Secībai jābūt veselam skaitlim." } as const;

  try {
    new URL(url);
  } catch {
    return { error: "Nederīgs spēļu saraksta URL." } as const;
  }

  if (standingsUrl) {
    try {
      new URL(standingsUrl);
    } catch {
      return { error: "Nederīgs tabulas URL." } as const;
    }
  }

  return { teamId, label, url, standingsUrl: standingsUrl || null, displayOrder } as const;
}

export async function createLeagueSource(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseLeagueSourceInput(formData);
  if ("error" in parsed) return parsed;

  await db.insert(leagueSources).values({ ...parsed, createdAt: Date.now() });
  revalidatePath("/admin/league-sources");
  revalidatePath("/");
  redirect("/admin/league-sources");
}

export async function updateLeagueSource(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseLeagueSourceInput(formData);
  if ("error" in parsed) return parsed;

  await db.update(leagueSources).set(parsed).where(eq(leagueSources.id, id));
  revalidatePath("/admin/league-sources");
  revalidatePath("/");
  redirect("/admin/league-sources");
}

export async function deleteLeagueSource(id: number) {
  await requireAdminSession();

  await db.delete(leagueSources).where(eq(leagueSources.id, id));
  revalidatePath("/admin/league-sources");
  revalidatePath("/");
}
