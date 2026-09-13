"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { pollOptions } from "@/db/schema";

/** Public vote for a homepage poll card — no auth, one vote per click;
 *  duplicate-vote prevention is handled client-side (localStorage) since
 *  these are casual polls, not something that needs to be tamper-proof. */
export async function voteForOption(optionId: number) {
  if (!Number.isInteger(optionId)) return;

  await db
    .update(pollOptions)
    .set({ votes: sql`${pollOptions.votes} + 1` })
    .where(eq(pollOptions.id, optionId));

  revalidatePath("/");
}
