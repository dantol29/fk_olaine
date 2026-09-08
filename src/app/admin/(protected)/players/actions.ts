"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { players } from "@/db/schema";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

function parsePlayerInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const birthdate = String(formData.get("birthdate") ?? "").trim();
  const teamId = Number(formData.get("teamId"));

  if (!name) return { error: "Vārds, uzvārds ir obligāts." } as const;
  if (!birthdate) return { error: "Dzimšanas datums ir obligāts." } as const;
  if (!teamId) return { error: "Jāizvēlas komanda." } as const;

  return { name, birthdate, teamId } as const;
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

  await db.insert(players).values({ ...parsed, photoUrl, createdAt: Date.now() });
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
  const updates: { name: string; birthdate: string; teamId: number; photoUrl?: string | null } = {
    ...parsed,
  };

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
