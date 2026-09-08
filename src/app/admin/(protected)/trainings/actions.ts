"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { trainings } from "@/db/schema";

function parseTrainingInput(formData: FormData) {
  const teamId = Number(formData.get("teamId"));
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!teamId) return { error: "Jāizvēlas komanda." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (!startTime) return { error: "Sākuma laiks ir obligāts." } as const;
  if (!endTime) return { error: "Beigu laiks ir obligāts." } as const;
  if (!location) return { error: "Vieta ir obligāta." } as const;

  return {
    teamId,
    date,
    startTime,
    endTime,
    location,
    notes: notes || null,
  } as const;
}

export async function createTraining(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseTrainingInput(formData);
  if ("error" in parsed) return parsed;

  await db.insert(trainings).values({ ...parsed, createdAt: Date.now() });
  revalidatePath("/admin/trainings");
  redirect("/admin/trainings");
}

export async function updateTraining(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseTrainingInput(formData);
  if ("error" in parsed) return parsed;

  await db.update(trainings).set(parsed).where(eq(trainings.id, id));
  revalidatePath("/admin/trainings");
  redirect("/admin/trainings");
}

export async function deleteTraining(id: number) {
  await db.delete(trainings).where(eq(trainings.id, id));
  revalidatePath("/admin/trainings");
}
