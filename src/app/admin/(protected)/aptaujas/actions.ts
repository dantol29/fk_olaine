"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { pollOptions, polls } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";

function revalidatePollPaths() {
  revalidatePath("/admin/aptaujas");
  revalidatePath("/");
}

function parsePollInput(formData: FormData) {
  const question = String(formData.get("question") ?? "").trim();
  const optionIds = formData.getAll("optionId").map((value) => String(value));
  const optionLabels = formData
    .getAll("optionLabel")
    .map((value) => String(value).trim());

  if (!question) return { error: "Jautājums ir obligāts." } as const;

  const rows = optionIds
    .map((id, index) => ({ id, label: optionLabels[index] ?? "" }))
    .filter((row) => row.label.length > 0);

  if (rows.length < 2) {
    return { error: "Nepieciešami vismaz divi atbilžu varianti." } as const;
  }

  return { question, rows } as const;
}

export async function createPoll(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parsePollInput(formData);
  if ("error" in parsed) return parsed;

  const now = Date.now();
  const [inserted] = await db
    .insert(polls)
    .values({ question: parsed.question, createdAt: now })
    .returning({ id: polls.id });

  await db.insert(pollOptions).values(
    parsed.rows.map((row) => ({
      pollId: inserted.id,
      label: row.label,
      votes: 0,
      createdAt: now,
    })),
  );

  revalidatePollPaths();
  redirect("/admin/aptaujas");
}

export async function updatePoll(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parsePollInput(formData);
  if ("error" in parsed) return parsed;

  await db.update(polls).set({ question: parsed.question }).where(eq(polls.id, id));

  const existingOptions = await db
    .select({ id: pollOptions.id })
    .from(pollOptions)
    .where(eq(pollOptions.pollId, id));
  const existingIds = new Set(existingOptions.map((option) => option.id));

  const keepIds = new Set<number>();
  const now = Date.now();
  for (const row of parsed.rows) {
    const numericId = Number(row.id);
    if (row.id && existingIds.has(numericId)) {
      keepIds.add(numericId);
      await db.update(pollOptions).set({ label: row.label }).where(eq(pollOptions.id, numericId));
    } else {
      const [inserted] = await db
        .insert(pollOptions)
        .values({ pollId: id, label: row.label, votes: 0, createdAt: now })
        .returning({ id: pollOptions.id });
      keepIds.add(inserted.id);
    }
  }

  const toDelete = [...existingIds].filter((existingId) => !keepIds.has(existingId));
  if (toDelete.length > 0) {
    await db.delete(pollOptions).where(inArray(pollOptions.id, toDelete));
  }

  revalidatePollPaths();
  redirect("/admin/aptaujas");
}

export async function deletePoll(id: number) {
  await requireAdminSession();

  await db.delete(polls).where(eq(polls.id, id));
  revalidatePollPaths();
}
