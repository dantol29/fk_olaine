import { db } from "@/db/client";
import { HomePollCard } from "@/components/home-poll-card";

export async function HomePollsSection() {
  const poll = await db.query.polls.findFirst({
    with: { options: true },
    orderBy: (polls, { desc }) => [desc(polls.createdAt), desc(polls.id)],
  });
  if (!poll || poll.options.length === 0) return null;
  return <HomePollCard variant="split" poll={{
    id: poll.id,
    question: poll.question,
    options: poll.options.map((option) => ({ id: option.id, label: option.label, votes: option.votes })),
  }} />;
}
