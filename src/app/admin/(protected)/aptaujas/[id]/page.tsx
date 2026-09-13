import { notFound } from "next/navigation";

import { db } from "@/db/client";

import { PollForm } from "./poll-form";

export default async function AdminPollFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") {
    return <PollForm mode="create" />;
  }

  const pollId = Number(id);
  const poll = await db.query.polls.findFirst({
    where: (polls, { eq }) => eq(polls.id, pollId),
    with: { options: true },
  });
  if (!poll) notFound();

  return <PollForm mode="edit" poll={poll} />;
}
