"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { events } from "@/db/schema";

function parseEventInput(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const teamIdRaw = String(formData.get("teamId") ?? "");
  const teamId = teamIdRaw ? Number(teamIdRaw) : null;

  if (!title) return { error: "Nosaukums ir obligāts." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (!startTime) return { error: "Sākuma laiks ir obligāts." } as const;
  if (!endTime) return { error: "Beigu laiks ir obligāts." } as const;
  if (!location) return { error: "Vieta ir obligāta." } as const;

  return {
    title,
    date,
    startTime,
    endTime,
    location,
    notes: notes || null,
    teamId,
  } as const;
}

export async function createEvent(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseEventInput(formData);
  if ("error" in parsed) return parsed;

  await db.insert(events).values({ ...parsed, createdAt: Date.now() });
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function updateEvent(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseEventInput(formData);
  if ("error" in parsed) return parsed;

  await db.update(events).set(parsed).where(eq(events.id, id));
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function deleteEvent(id: number) {
  await db.delete(events).where(eq(events.id, id));
  revalidatePath("/admin/events");
}
