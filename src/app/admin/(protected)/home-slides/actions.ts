"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parseHomeSlides } from "@/lib/home-slides";
import { getSiteSettings } from "@/lib/site-settings";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

function refreshSlides() {
  revalidatePath("/");
  revalidatePath("/admin/home-slides");
}

export async function addHomeSlide(_state: { error?: string; success?: boolean } | undefined, data: FormData) {
  await requireAdminSession();
  const image = data.get("image");
  if (!(image instanceof File) || !image.size) return { error: "Izvēlies attēlu." };
  let url: string;
  try {
    url = await saveUploadedPhoto(image, "home-slides");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Neizdevās augšupielādēt attēlu." };
  }
  try {
    await getSiteSettings(); // Ensure the singleton row exists before updating it.
    await db.transaction(async (tx) => {
      const [row] = await tx.select({ images: siteSettings.sakumlapasAtteli }).from(siteSettings).where(eq(siteSettings.id, 1));
      if (!row) throw new Error("Vietnes iestatījumi nav pieejami.");
      await tx.update(siteSettings).set({ sakumlapasAtteli: [...parseHomeSlides(row.images), url].join("\n"), updatedAt: Date.now() }).where(eq(siteSettings.id, 1));
    });
  } catch (error) {
    await deleteUploadedPhoto(url);
    console.error("Failed to save homepage image", error);
    return { error: "Neizdevās saglabāt attēlu. Lūdzu, mēģini vēlreiz." };
  }
  refreshSlides();
  return { success: true };
}

export async function removeHomeSlide(data: FormData) {
  await requireAdminSession();
  const image = String(data.get("image") ?? "");
  if (!image || /[\r\n]/.test(image)) throw new Error("Nederīgs attēls.");
  const removed = await db.transaction(async (tx) => {
    const [row] = await tx.select({ images: siteSettings.sakumlapasAtteli }).from(siteSettings).where(eq(siteSettings.id, 1));
    const images = parseHomeSlides(row?.images);
    if (!row || !images.includes(image)) return false;
    await tx.update(siteSettings).set({ sakumlapasAtteli: images.filter((url) => url !== image).join("\n"), updatedAt: Date.now() }).where(eq(siteSettings.id, 1));
    return true;
  });
  // Only remove files belonging to this gallery; other references remain untouched.
  if (removed && /^\/uploads\/home-slides\/[a-f0-9-]+\.(jpg|png|webp)$/.test(image)) await deleteUploadedPhoto(image);
  refreshSlides();
}
