"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { coachTeams, coaches } from "@/db/schema";

function parseCoachInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const license = String(formData.get("license") ?? "").trim();
  const authority = String(formData.get("authority") ?? "");
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();
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
    photoUrl: photoUrl || null,
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

  const { teamIds, ...coachFields } = parsed;
  const [inserted] = await db
    .insert(coaches)
    .values({ ...coachFields, createdAt: Date.now() })
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

  const { teamIds, ...coachFields } = parsed;
  await db.update(coaches).set(coachFields).where(eq(coaches.id, id));
  await syncCoachTeams(id, teamIds);

  revalidatePath("/admin/coaches");
  revalidatePath("/treneri");
  redirect("/admin/coaches");
}

export async function deleteCoach(id: number) {
  await db.delete(coaches).where(eq(coaches.id, id));
  revalidatePath("/admin/coaches");
  revalidatePath("/treneri");
}
