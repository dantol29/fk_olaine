"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { playerTeams, players } from "@/db/schema";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

function parsePlayerInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const birthdate = String(formData.get("birthdate") ?? "").trim();
  const teamIds = formData.getAll("teamIds").map(Number).filter((n) => Number.isFinite(n));

  if (!name) return { error: "Vārds, uzvārds ir obligāts." } as const;
  if (!birthdate) return { error: "Dzimšanas datums ir obligāts." } as const;
  if (teamIds.length === 0) return { error: "Jāizvēlas vismaz viena komanda." } as const;

  return { name, birthdate, teamIds } as const;
}

async function syncPlayerTeams(playerId: number, teamIds: number[]) {
  await db.delete(playerTeams).where(eq(playerTeams.playerId, playerId));
  if (teamIds.length > 0) {
    await db.insert(playerTeams).values(teamIds.map((teamId) => ({ playerId, teamId })));
  }
}

export async function createPlayer(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parsePlayerInput(formData);
  if ("error" in parsed) return parsed;

  const photo = formData.get("photo");
  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await saveUploadedPhoto(photo, "players");
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  const { teamIds, ...playerFields } = parsed;
  const [inserted] = await db
    .insert(players)
    .values({ ...playerFields, photoUrl, createdAt: Date.now() })
    .returning({ id: players.id });
  await syncPlayerTeams(inserted.id, teamIds);

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

  const photo = formData.get("photo");
  const removePhoto = formData.get("removePhoto") === "on";

  const { teamIds, ...playerFields } = parsed;
  const updates: typeof playerFields & { photoUrl?: string | null } = { ...playerFields };

  if (photo instanceof File && photo.size > 0) {
    let newPhotoUrl: string;
    try {
      newPhotoUrl = await saveUploadedPhoto(photo, "players");
    } catch (error) {
      return { error: (error as Error).message };
    }
    const [existing] = await db
      .select({ photoUrl: players.photoUrl })
      .from(players)
      .where(eq(players.id, id));
    await deleteUploadedPhoto(existing?.photoUrl ?? null);
    updates.photoUrl = newPhotoUrl;
  } else if (removePhoto) {
    const [existing] = await db
      .select({ photoUrl: players.photoUrl })
      .from(players)
      .where(eq(players.id, id));
    await deleteUploadedPhoto(existing?.photoUrl ?? null);
    updates.photoUrl = null;
  }

  await db.update(players).set(updates).where(eq(players.id, id));
  await syncPlayerTeams(id, teamIds);

  revalidatePath("/admin/players");
  revalidatePath("/komandas");
  redirect("/admin/players");
}

export async function deletePlayer(id: number) {
  const [existing] = await db
    .select({ photoUrl: players.photoUrl })
    .from(players)
    .where(eq(players.id, id));
  await deleteUploadedPhoto(existing?.photoUrl ?? null);

  await db.delete(players).where(eq(players.id, id));
  revalidatePath("/admin/players");
  revalidatePath("/komandas");
}
