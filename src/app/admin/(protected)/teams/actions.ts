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

  const isMain = formData.get("isMain") === "on";
  await db.transaction(async (transaction) => {
    if (isMain) await transaction.update(teams).set({ isMain: false }).where(eq(teams.isMain, true));
    await transaction.insert(teams).values({ name, isMain, createdAt: Date.now() });
  });
  revalidatePath("/");
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

  const isMain = formData.get("isMain") === "on";
  const existing = await db.query.teams.findFirst({ where: eq(teams.id, id) });
  if (!existing) return { error: "Komanda nav atrasta." };
  await db.transaction(async (transaction) => {
    if (isMain) await transaction.update(teams).set({ isMain: false }).where(eq(teams.isMain, true));
    await transaction.update(teams).set({ name, isMain }).where(eq(teams.id, id));
  });
  revalidatePath("/");
  revalidatePath("/admin/teams");
  revalidatePath("/komandas");
  redirect("/admin/teams");
}

export async function deleteTeam(id: number) {
  await requireAdminSession();

  await db.delete(teams).where(eq(teams.id, id));
  revalidatePath("/");
  revalidatePath("/admin/teams");
  revalidatePath("/komandas");
}
