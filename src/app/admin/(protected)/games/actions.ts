"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { games } from "@/db/schema";

function parseGameInput(formData: FormData) {
  const teamId = Number(formData.get("teamId"));
  const opponent = String(formData.get("opponent") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const homeAway = String(formData.get("homeAway") ?? "");
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!teamId) return { error: "Jāizvēlas komanda." } as const;
  if (!opponent) return { error: "Pretinieks ir obligāts." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (homeAway !== "home" && homeAway !== "away") {
    return { error: "Jāizvēlas mājas vai izbraukuma spēle." } as const;
  }

  return {
    teamId,
    opponent,
    date,
    time: time || null,
    homeAway: homeAway as "home" | "away",
    location: location || null,
    notes: notes || null,
  } as const;
}

export async function createGame(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = parseGameInput(formData);
  if ("error" in parsed) return parsed;

  await db.insert(games).values({ ...parsed, createdAt: Date.now() });
  revalidatePath("/admin/games");
  redirect("/admin/games");
}

export async function updateGame(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseGameInput(formData);
  if ("error" in parsed) return parsed;

  await db.update(games).set(parsed).where(eq(games.id, id));
  revalidatePath("/admin/games");
  redirect("/admin/games");
}

export async function deleteGame(id: number) {
  await db.delete(games).where(eq(games.id, id));
  revalidatePath("/admin/games");
}
