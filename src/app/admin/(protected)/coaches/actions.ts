"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { coachTeams, coaches } from "@/db/schema";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

function parseCoachInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const license = String(formData.get("license") ?? "").trim();
  const authority = String(formData.get("authority") ?? "");
  const teamIds = formData.getAll("teamIds").map(Number).filter((n) => Number.isFinite(n));

  if (!name) return { error: "Vārds, uzvārds ir obligāts." } as const;
  if (!position) return { error: "Amats ir obligāts." } as const;
  if (!license) return { error: "Licence ir obligāta." } as const;
  if (authority !== "UEFA" && authority !== "LFF") {
    return { error: "Jāizvēlas licences izdevējs." } as const;
  }

  return {
    name,
    position,
    license,
    authority: authority as "UEFA" | "LFF",
    teamIds,
  } as const;
}

async function syncCoachTeams(coachId: number, teamIds: number[]) {
  await db.delete(coachTeams).where(eq(coachTeams.coachId, coachId));
  if (teamIds.length > 0) {
    await db.insert(coachTeams).values(teamIds.map((teamId) => ({ coachId, teamId })));
  }
}

export async function createCoach(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseCoachInput(formData);
  if ("error" in parsed) return parsed;

  const photo = formData.get("photo");
  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await saveUploadedPhoto(photo, "coaches");
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  const { teamIds, ...coachFields } = parsed;
  const [inserted] = await db
    .insert(coaches)
    .values({ ...coachFields, photoUrl, createdAt: Date.now() })
    .returning({ id: coaches.id });
  await syncCoachTeams(inserted.id, teamIds);

  revalidatePath("/admin/coaches");
  revalidatePath("/treneri");
  redirect("/admin/coaches");
}

export async function updateCoach(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseCoachInput(formData);
  if ("error" in parsed) return parsed;

  const photo = formData.get("photo");
  const removePhoto = formData.get("removePhoto") === "on";

  const { teamIds, ...coachFields } = parsed;
  const updates: typeof coachFields & { photoUrl?: string | null } = { ...coachFields };

  if (photo instanceof File && photo.size > 0) {
    let newPhotoUrl: string;
    try {
      newPhotoUrl = await saveUploadedPhoto(photo, "coaches");
    } catch (error) {
      return { error: (error as Error).message };
    }
    const [existing] = await db
      .select({ photoUrl: coaches.photoUrl })
      .from(coaches)
      .where(eq(coaches.id, id));
    await deleteUploadedPhoto(existing?.photoUrl ?? null);
    updates.photoUrl = newPhotoUrl;
  } else if (removePhoto) {
    const [existing] = await db
      .select({ photoUrl: coaches.photoUrl })
      .from(coaches)
      .where(eq(coaches.id, id));
    await deleteUploadedPhoto(existing?.photoUrl ?? null);
    updates.photoUrl = null;
  }

  await db.update(coaches).set(updates).where(eq(coaches.id, id));
  await syncCoachTeams(id, teamIds);

  revalidatePath("/admin/coaches");
  revalidatePath("/treneri");
  redirect("/admin/coaches");
}

export async function deleteCoach(id: number) {
  const [existing] = await db
    .select({ photoUrl: coaches.photoUrl })
    .from(coaches)
    .where(eq(coaches.id, id));
  await deleteUploadedPhoto(existing?.photoUrl ?? null);

  await db.delete(coaches).where(eq(coaches.id, id));
  revalidatePath("/admin/coaches");
  revalidatePath("/treneri");
}
