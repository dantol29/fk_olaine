"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { clubLogos } from "@/db/schema";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

export async function createClubLogo(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nosaukums ir obligāts." };

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Logotips ir obligāts." };
  }

  let logoUrl: string;
  try {
    logoUrl = await saveUploadedPhoto(photo, "clubs");
  } catch (error) {
    return { error: (error as Error).message };
  }

  await db.insert(clubLogos).values({ name, logoUrl, createdAt: Date.now() });
  revalidatePath("/admin/club-logos");
  redirect("/admin/club-logos");
}

export async function updateClubLogo(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nosaukums ir obligāts." };

  const photo = formData.get("photo");
  const updates: { name: string; logoUrl?: string } = { name };

  if (photo instanceof File && photo.size > 0) {
    let newLogoUrl: string;
    try {
      newLogoUrl = await saveUploadedPhoto(photo, "clubs");
    } catch (error) {
      return { error: (error as Error).message };
    }
    const [existing] = await db
      .select({ logoUrl: clubLogos.logoUrl })
      .from(clubLogos)
      .where(eq(clubLogos.id, id));
    await deleteUploadedPhoto(existing?.logoUrl ?? null);
    updates.logoUrl = newLogoUrl;
  }

  await db.update(clubLogos).set(updates).where(eq(clubLogos.id, id));
  revalidatePath("/admin/club-logos");
  redirect("/admin/club-logos");
}

export async function deleteClubLogo(id: number) {
  const [existing] = await db
    .select({ logoUrl: clubLogos.logoUrl })
    .from(clubLogos)
    .where(eq(clubLogos.id, id));
  await deleteUploadedPhoto(existing?.logoUrl ?? null);

  await db.delete(clubLogos).where(eq(clubLogos.id, id));
  revalidatePath("/admin/club-logos");
}
