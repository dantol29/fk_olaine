"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { leagueSources } from "@/db/schema";

function parseLeagueSourceInput(formData: FormData) {
  const teamId = Number(formData.get("teamId"));
  const label = String(formData.get("label") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();

  if (!teamId) return { error: "Jāizvēlas komanda." } as const;
  if (!label) return { error: "Nosaukums ir obligāts." } as const;
  if (!url) return { error: "URL ir obligāts." } as const;

  try {
    new URL(url);
  } catch {
    return { error: "Nederīgs URL." } as const;
  }

  return { teamId, label, url } as const;
}

export async function createLeagueSource(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseLeagueSourceInput(formData);
  if ("error" in parsed) return parsed;

  await db.insert(leagueSources).values({ ...parsed, createdAt: Date.now() });
  revalidatePath("/admin/league-sources");
  redirect("/admin/league-sources");
}

export async function updateLeagueSource(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseLeagueSourceInput(formData);
  if ("error" in parsed) return parsed;

  await db.update(leagueSources).set(parsed).where(eq(leagueSources.id, id));
  revalidatePath("/admin/league-sources");
  redirect("/admin/league-sources");
}

export async function deleteLeagueSource(id: number) {
  await db.delete(leagueSources).where(eq(leagueSources.id, id));
  revalidatePath("/admin/league-sources");
}
