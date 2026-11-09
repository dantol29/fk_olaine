"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { trainings } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parseTrainingInput } from "@/lib/training-input";
import { saveTraining } from "@/lib/training-store";

export async function createTraining(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseTrainingInput(formData);
  if ("error" in parsed) return parsed;

  await saveTraining(db, parsed);

  revalidatePath("/");
  revalidatePath("/admin/trainings");
  revalidatePath("/kalendars");
  revalidatePath("/admin/calendar");
  revalidatePath("/treninji");
  redirect("/admin/trainings");
}

export async function updateTraining(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseTrainingInput(formData);
  if ("error" in parsed) return parsed;

  await saveTraining(db, parsed, id);

  revalidatePath("/");
  revalidatePath("/admin/trainings");
  revalidatePath("/kalendars");
  revalidatePath("/admin/calendar");
  revalidatePath("/treninji");
  redirect("/admin/trainings");
}

export async function deleteTraining(id: number) {
  await requireAdminSession();

  await db.delete(trainings).where(eq(trainings.id, id));
  revalidatePath("/");
  revalidatePath("/admin/trainings");
  revalidatePath("/kalendars");
  revalidatePath("/admin/calendar");
  revalidatePath("/treninji");
}
