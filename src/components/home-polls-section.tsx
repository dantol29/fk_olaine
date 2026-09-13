import { MessageCircleQuestion } from "lucide-react";

import { db } from "@/db/client";
import { HomePollCard, type Poll } from "@/components/home-poll-card";

const MAX_POLLS = 2;

async function getPolls(): Promise<Poll[]> {
  const rows = await db.query.polls.findMany({
    with: { options: true },
    orderBy: (polls, { asc }) => [asc(polls.createdAt)],
    limit: MAX_POLLS,
  });

  return rows.map((poll) => ({
    id: poll.id,
    question: poll.question,
    options: poll.options.map((option) => ({
      id: option.id,
      label: option.label,
      votes: option.votes,
    })),
  }));
}

function EmptyPollSlot() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 p-6 text-center">
      <MessageCircleQuestion className="h-6 w-6 text-slate-300" strokeWidth={1.5} />
      <p className="text-sm text-slate-400">Šeit drīzumā būs jauna aptauja.</p>
    </div>
  );
}

export async function HomePollsSection() {
  const polls = await getPolls();
  const slots = Array.from({ length: MAX_POLLS }, (_, i) => polls[i] ?? null);

  return (
    <div>
      <div className="relative flex min-h-24 flex-col items-center justify-center sm:min-h-32 sm:items-start">
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:text-8xl"
        >
          Aptaujas
        </span>
        <h2 className="relative text-center text-3xl tracking-[-0.02em] text-club-navy sm:text-left sm:text-4xl">
          Aptaujas
        </h2>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 lg:grid-cols-[3fr_2fr] lg:min-h-[24rem]">
        {slots.map((poll, index) =>
          poll ? (
            <HomePollCard
              key={poll.id}
              poll={poll}
              imageSrc={index === 0 ? "/stadions.jpg" : undefined}
            />
          ) : (
            <EmptyPollSlot key={`empty-${index}`} />
          ),
        )}
      </div>
    </div>
  );
}
