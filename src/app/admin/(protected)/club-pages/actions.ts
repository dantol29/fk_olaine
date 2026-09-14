"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { clubPages } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { richTextHasContent, sanitizeRichText } from "@/lib/rich-text";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

const MAX_IMAGES = 6;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePageInput(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "") || title);
  const description = String(formData.get("description") ?? "").trim();
  const body = sanitizeRichText(String(formData.get("body") ?? ""));
  const displayOrder = Number.parseInt(String(formData.get("displayOrder") ?? "0"), 10);
  const isPublished = formData.get("isPublished") === "on";

  if (!title) return { error: "Virsraksts ir obligāts." } as const;
  if (title.length > 120) return { error: "Virsraksts nedrīkst pārsniegt 120 rakstzīmes." } as const;
  if (!slug) return { error: "Neizdevās izveidot derīgu lapas saiti." } as const;
  if (slug.length > 100) return { error: "Lapas saite nedrīkst pārsniegt 100 rakstzīmes." } as const;
  if (!description) return { error: "Īsais apraksts ir obligāts." } as const;
  if (description.length > 240) return { error: "Īsais apraksts nedrīkst pārsniegt 240 rakstzīmes." } as const;
  if (!richTextHasContent(body)) return { error: "Lapas teksts ir obligāts." } as const;
  if (body.length > 100_000) return { error: "Lapas teksts ir pārāk garš." } as const;
  if (!Number.isSafeInteger(displayOrder)) return { error: "Secībai jābūt veselam skaitlim." } as const;

  return { title, slug, description, body, displayOrder, isPublished } as const;
}

function uploadedImages(formData: FormData) {
  return formData.getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

async function saveImages(files: File[]) {
  const urls: string[] = [];
  try {
    for (const file of files) urls.push(await saveUploadedPhoto(file, "club-pages"));
    return urls;
  } catch (error) {
    await Promise.all(urls.map((url) => deleteUploadedPhoto(url)));
    throw error;
  }
}

async function slugIsTaken(slug: string, excludedId?: number) {
  const [existing] = await db.select({ id: clubPages.id }).from(clubPages).where(eq(clubPages.slug, slug));
  return Boolean(existing && existing.id !== excludedId);
}

function revalidateClubPages(slugs: string[]) {
  revalidatePath("/", "layout");
  revalidatePath("/admin/club-pages");
  revalidatePath("/sitemap.xml");
  for (const slug of slugs) revalidatePath(`/klubs/${slug}`);
}

export async function createClubPage(
  _previous: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();
  const parsed = parsePageInput(formData);
  if ("error" in parsed) return parsed;
  if (await slugIsTaken(parsed.slug)) return { error: `Saite "${parsed.slug}" jau tiek izmantota.` };

  const files = uploadedImages(formData);
  if (files.length > MAX_IMAGES) return { error: `Vienai lapai var pievienot ne vairāk kā ${MAX_IMAGES} attēlus.` };
  let imageUrls: string[];
  try {
    imageUrls = await saveImages(files);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const now = Date.now();
  await db.insert(clubPages).values({
    ...parsed,
    images: imageUrls.length ? imageUrls.join("\n") : null,
    createdAt: now,
    updatedAt: now,
  });
  revalidateClubPages([parsed.slug]);
  redirect("/admin/club-pages");
}

export async function updateClubPage(
  id: number,
  _previous: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();
  const parsed = parsePageInput(formData);
  if ("error" in parsed) return parsed;
  if (await slugIsTaken(parsed.slug, id)) return { error: `Saite "${parsed.slug}" jau tiek izmantota.` };

  const [existing] = await db.select().from(clubPages).where(eq(clubPages.id, id));
  if (!existing) return { error: "Lapa nav atrasta." };
  const currentImages = existing.images?.split("\n").filter(Boolean) ?? [];
  const removed = new Set(formData.getAll("removeImages").map(String));
  const retainedImages = currentImages.filter((url) => !removed.has(url));
  const files = uploadedImages(formData);
  if (retainedImages.length + files.length > MAX_IMAGES) {
    return { error: `Vienai lapai var pievienot ne vairāk kā ${MAX_IMAGES} attēlus.` };
  }
  let newImages: string[];
  try {
    newImages = await saveImages(files);
  } catch (error) {
    return { error: (error as Error).message };
  }
  const images = [...retainedImages, ...newImages];
  await db.update(clubPages).set({
    ...parsed,
    images: images.length ? images.join("\n") : null,
    updatedAt: Date.now(),
  }).where(eq(clubPages.id, id));
  await Promise.all(currentImages.filter((url) => removed.has(url)).map(deleteUploadedPhoto));
  revalidateClubPages([existing.slug, parsed.slug]);
  redirect("/admin/club-pages");
}

export async function deleteClubPage(id: number) {
  await requireAdminSession();
  const [existing] = await db.select().from(clubPages).where(eq(clubPages.id, id));
  if (existing?.images) {
    await Promise.all(existing.images.split("\n").filter(Boolean).map(deleteUploadedPhoto));
  }
  await db.delete(clubPages).where(eq(clubPages.id, id));
  revalidateClubPages(existing ? [existing.slug] : []);
}
