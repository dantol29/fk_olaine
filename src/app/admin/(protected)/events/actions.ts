"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { eventTeams, events, teams } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parseEventInput } from "@/lib/events";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type EventPhotos = { image: string | null; gallery: string | null };

// The form always sends the whole set of ticked teams; none means the event belongs to no team.
async function syncEventTeams(tx: Transaction, eventId: number, teamIds: number[]) {
  await tx.delete(eventTeams).where(eq(eventTeams.eventId, eventId));
  if (teamIds.length > 0) await tx.insert(eventTeams).values(teamIds.map((teamId) => ({ eventId, teamId })));
}

/** An error when a ticked team no longer exists (deleted in another tab), before anything is written. */
async function missingTeamError(teamIds: number[]): Promise<{ error: string } | null> {
  if (teamIds.length === 0) return null;
  const found = await db.select({ id: teams.id }).from(teams).where(inArray(teams.id, teamIds));
  return found.length === teamIds.length ? null : { error: "Kāda no izvēlētajām komandām vairs nav atrodama." };
}

function galleryUrls(gallery: string | null): string[] {
  return gallery?.split("\n").filter(Boolean) ?? [];
}

function uploadedFiles(formData: FormData, name: string): File[] {
  return formData.getAll(name).filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

/** The photos after this save, as for news: a new main photo replaces the old one, new gallery photos replace the
 *  whole gallery, and the "remove" boxes clear them. New files are stored first; `replaced` lists the old files to
 *  delete once the event is saved, so a failed save never loses a photo that is still in use. */
async function resolveEventPhotos(formData: FormData, current: EventPhotos): Promise<{ photos: EventPhotos; replaced: string[] } | { error: string }> {
  const [image] = uploadedFiles(formData, "image");
  const galleryFiles = uploadedFiles(formData, "gallery");
  const photos = { ...current };
  try {
    if (image) photos.image = await saveUploadedPhoto(image, "events");
    else if (formData.get("removeImage") === "on") photos.image = null;
    if (galleryFiles.length > 0) {
      const urls: string[] = [];
      for (const file of galleryFiles) urls.push(await saveUploadedPhoto(file, "events"));
      photos.gallery = urls.join("\n");
    } else if (formData.get("removeGallery") === "on") {
      photos.gallery = null;
    }
  } catch (error) {
    return { error: (error as Error).message };
  }
  const replaced = [
    ...(current.image && photos.image !== current.image ? [current.image] : []),
    ...(photos.gallery !== current.gallery ? galleryUrls(current.gallery) : []),
  ];
  return { photos, replaced };
}

async function deletePhotos(urls: readonly string[]) {
  for (const url of urls) await deleteUploadedPhoto(url);
}

function revalidateEventPages() {
  revalidatePath("/admin/events");
  revalidatePath("/admin/calendar");
  revalidatePath("/kalendars");
  revalidatePath("/notikumi");
  revalidatePath("/notikumi/[slug]", "page");
  revalidatePath("/sitemap.xml");
}

export async function createEvent(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseEventInput(formData);
  if ("error" in parsed) return parsed;
  const { teamIds, ...eventFields } = parsed;
  const missing = await missingTeamError(teamIds);
  if (missing) return missing;
  const resolved = await resolveEventPhotos(formData, { image: null, gallery: null });
  if ("error" in resolved) return resolved;

  await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(events).values({ ...eventFields, ...resolved.photos, createdAt: Date.now() }).returning({ id: events.id });
    await syncEventTeams(tx, inserted.id, teamIds);
  });
  revalidateEventPages();
  redirect("/admin/events");
}

export async function updateEvent(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseEventInput(formData);
  if ("error" in parsed) return parsed;
  const [existing] = await db.select({ image: events.image, gallery: events.gallery }).from(events).where(eq(events.id, id));
  if (!existing) return { error: "Notikums nav atrasts." };
  const { teamIds, ...eventFields } = parsed;
  const missing = await missingTeamError(teamIds);
  if (missing) return missing;
  const resolved = await resolveEventPhotos(formData, existing);
  if ("error" in resolved) return resolved;

  await db.transaction(async (tx) => {
    await tx.update(events).set({ ...eventFields, ...resolved.photos }).where(eq(events.id, id));
    await syncEventTeams(tx, id, teamIds);
  });
  await deletePhotos(resolved.replaced);
  revalidateEventPages();
  redirect("/admin/events");
}

export async function deleteEvent(id: number) {
  await requireAdminSession();

  const [existing] = await db.select({ image: events.image, gallery: events.gallery }).from(events).where(eq(events.id, id));
  await db.delete(events).where(eq(events.id, id));
  if (existing) await deletePhotos([...(existing.image ? [existing.image] : []), ...galleryUrls(existing.gallery)]);
  revalidateEventPages();
}
