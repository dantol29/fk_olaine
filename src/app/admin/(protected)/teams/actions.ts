"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { teams } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";

export async function createTeam(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nosaukums ir obligāts." };

  await db.insert(teams).values({ name, createdAt: Date.now() });
  revalidatePath("/admin/teams");
  revalidatePath("/komandas");
  redirect("/admin/teams");
}

export async function updateTeam(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nosaukums ir obligāts." };

  await db.update(teams).set({ name }).where(eq(teams.id, id));
  revalidatePath("/admin/teams");
  revalidatePath("/komandas");
  redirect("/admin/teams");
}

export async function deleteTeam(id: number) {
  await requireAdminSession();

  await db.delete(teams).where(eq(teams.id, id));
  revalidatePath("/admin/teams");
  revalidatePath("/komandas");
}
