"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { players } from "@/db/schema";

function parsePlayerInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const birthdate = String(formData.get("birthdate") ?? "").trim();
  const teamId = Number(formData.get("teamId"));
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();

  if (!name) return { error: "Vārds, uzvārds ir obligāts." } as const;
  if (!birthdate) return { error: "Dzimšanas datums ir obligāts." } as const;
  if (!teamId) return { error: "Jāizvēlas komanda." } as const;

  return { name, birthdate, teamId, photoUrl: photoUrl || null } as const;
}

export async function createPlayer(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parsePlayerInput(formData);
  if ("error" in parsed) return parsed;

  await db.insert(players).values({ ...parsed, createdAt: Date.now() });
  revalidatePath("/admin/players");
  revalidatePath("/komandas");
  redirect("/admin/players");
}

export async function updatePlayer(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parsePlayerInput(formData);
  if ("error" in parsed) return parsed;

  await db.update(players).set(parsed).where(eq(players.id, id));
  revalidatePath("/admin/players");
  revalidatePath("/komandas");
  redirect("/admin/players");
}

export async function deletePlayer(id: number) {
  await db.delete(players).where(eq(players.id, id));
  revalidatePath("/admin/players");
  revalidatePath("/komandas");
}
