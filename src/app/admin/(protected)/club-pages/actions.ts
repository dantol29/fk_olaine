"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { clubPages } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { richTextHasContent, sanitizeRichText } from "@/lib/rich-text";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";
import { parseClubPageMedia, parsePageAction, serializeClubPageMedia, type ClubPageMedia } from "@/lib/club-page-media";

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

function parseMediaInput(formData: FormData, current: ClubPageMedia, files: File[]) {
  try {
    const raw = String(formData.get("actionButtons") ?? "[]");
    if (raw.length > 12000) throw new Error("Pogu dati ir pārāk gari.");
    let values: unknown;
    try { values = JSON.parse(raw); } catch { throw new Error("Neizdevās nolasīt pogas."); }
    if (!Array.isArray(values) || values.length > 6) throw new Error("Lapā var būt līdz 6 pogām.");
    const actions = values.map(parsePageAction);
    const removed = new Set(formData.getAll("removeImages").map(String));
    function text(value: FormDataEntryValue | null | undefined, max: number) {
      const result = String(value ?? "").trim();
      if (result.length > max) throw new Error(`Attēla apraksts ir pārāk garš (līdz ${max} rakstzīmēm).`);
      return result;
    }
    const retained = current.photos.filter(photo => !removed.has(photo.src)).map(photo => ({ ...photo,
      alt: text(formData.get(`imageAlt:${photo.src}`) ?? photo.alt, 200),
      caption: text(formData.get(`imageCaption:${photo.src}`) ?? photo.caption, 240),
    }));
    if (retained.length + files.length > MAX_IMAGES) throw new Error(`Vienai lapai var pievienot ne vairāk kā ${MAX_IMAGES} attēlus.`);
    if (files.reduce((total, file) => total + file.size, 0) > 5 * 1024 * 1024) throw new Error("Vienā reizē augšupielādē līdz 5 MB attēlu.");
    const alts = formData.getAll("newImageAlt"), captions = formData.getAll("newImageCaption");
    const newDetails = files.map((_, index) => ({ alt: text(alts[index], 200), caption: text(captions[index], 240) }));
    const layout: ClubPageMedia["layout"] = formData.get("imageLayout") === "sidebar" ? "sidebar" : "gallery";
    return { layout, actions, retained, newDetails };
  } catch (error) { return { error: (error as Error).message }; }
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
  const media = parseMediaInput(formData, parseClubPageMedia(null), files);
  if ("error" in media) return media;
  let imageUrls: string[];
  try {
    imageUrls = await saveImages(files);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const now = Date.now();
  try {
    await db.insert(clubPages).values({
      ...parsed,
      images: serializeClubPageMedia({ layout: media.layout, actions: media.actions, photos: imageUrls.map((src, index) => ({ src, ...media.newDetails[index] })) }),
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    await Promise.all(imageUrls.map(deleteUploadedPhoto));
    throw error;
  }
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
  const currentMedia = parseClubPageMedia(existing.images);
  const files = uploadedImages(formData);
  const media = parseMediaInput(formData, currentMedia, files);
  if ("error" in media) return media;
  let newImages: string[];
  try {
    newImages = await saveImages(files);
  } catch (error) {
    return { error: (error as Error).message };
  }
  const photos = [...media.retained, ...newImages.map((src, index) => ({ src, ...media.newDetails[index] }))];
  try {
    await db.update(clubPages).set({
      ...parsed,
      images: serializeClubPageMedia({ layout: media.layout, actions: media.actions, photos }),
      updatedAt: Date.now(),
    }).where(eq(clubPages.id, id));
  } catch (error) {
    await Promise.all(newImages.map(deleteUploadedPhoto));
    throw error;
  }
  await Promise.all(currentMedia.photos.filter(photo => !photos.some(retained => retained.src === photo.src)).map(photo => deleteUploadedPhoto(photo.src)));
  revalidateClubPages([existing.slug, parsed.slug]);
  redirect("/admin/club-pages");
}

export async function deleteClubPage(id: number) {
  await requireAdminSession();
  const [existing] = await db.select().from(clubPages).where(eq(clubPages.id, id));
  await db.delete(clubPages).where(eq(clubPages.id, id));
  if (existing?.images) await Promise.all(parseClubPageMedia(existing.images).photos.map(photo => deleteUploadedPhoto(photo.src)));
  revalidateClubPages(existing ? [existing.slug] : []);
}
