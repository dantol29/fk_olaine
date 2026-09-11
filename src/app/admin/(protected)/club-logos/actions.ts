"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { clubLogoNames, clubLogos } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

function parseNames(formData: FormData): string[] {
  const raw = String(formData.get("names") ?? "");
  return [
    ...new Set(
      raw
        .split("\n")
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ];
}

async function syncClubLogoNames(clubLogoId: number, names: string[]) {
  await db.delete(clubLogoNames).where(eq(clubLogoNames.clubLogoId, clubLogoId));
  if (names.length > 0) {
    await db.insert(clubLogoNames).values(names.map((name) => ({ clubLogoId, name })));
  }
}

export async function createClubLogo(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const names = parseNames(formData);
  if (names.length === 0) return { error: "Jānorāda vismaz viens nosaukums." };

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

  const [inserted] = await db
    .insert(clubLogos)
    .values({ logoUrl, createdAt: Date.now() })
    .returning({ id: clubLogos.id });
  await syncClubLogoNames(inserted.id, names);

  revalidatePath("/admin/club-logos");
  redirect("/admin/club-logos");
}

export async function updateClubLogo(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const names = parseNames(formData);
  if (names.length === 0) return { error: "Jānorāda vismaz viens nosaukums." };

  const photo = formData.get("photo");

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
    await db.update(clubLogos).set({ logoUrl: newLogoUrl }).where(eq(clubLogos.id, id));
  }

  await syncClubLogoNames(id, names);

  revalidatePath("/admin/club-logos");
  redirect("/admin/club-logos");
}

export async function deleteClubLogo(id: number) {
  await requireAdminSession();

  const [existing] = await db
    .select({ logoUrl: clubLogos.logoUrl })
    .from(clubLogos)
    .where(eq(clubLogos.id, id));
  await deleteUploadedPhoto(existing?.logoUrl ?? null);

  await db.delete(clubLogos).where(eq(clubLogos.id, id));
  revalidatePath("/admin/club-logos");
}
