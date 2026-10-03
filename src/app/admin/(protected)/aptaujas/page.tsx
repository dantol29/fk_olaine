import { Pencil } from "lucide-react";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { AdminSearch } from "@/components/admin/admin-search";
import { db } from "@/db/client";

import { deletePoll } from "./actions";

export default async function AdminPollsPage() {
  const rows = await db.query.polls.findMany({
    with: { options: true },
    orderBy: (polls, { asc }) => [asc(polls.createdAt)],
  });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black">Aptaujas</h1>
        <Link
          href="/admin/aptaujas/new"
          className="rounded-none bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>
      <p className="mb-6 text-sm text-black/45">
        Sākumlapā rāda pirmās 3 aptaujas pēc izveides secības.
      </p>
      <AdminSearch placeholder="Meklēt aptaujas…" />

      {rows.length === 0 ? (
        <p className="rounded-none bg-white p-8 text-center text-sm text-black/45 shadow-none">
          Vēl nav pievienota neviena aptauja.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((poll) => {
            const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
            return (
              <div
                key={poll.id}
                data-admin-search-item={poll.question}
                className="rounded-none bg-white p-5 shadow-none"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-black">{poll.question}</p>
                    <p className="mt-1 text-xs text-black/45">
                      {poll.options.length} varianti · {totalVotes} balsis
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/aptaujas/${poll.id}`}
                      aria-label={`Rediģēt aptauju "${poll.question}"`}
                      title="Rediģēt"
                      className="flex h-8 w-8 items-center justify-center rounded-none text-black transition hover:bg-[#f5f5f5]"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteButton
                      action={deletePoll.bind(null, poll.id)}
                      confirmMessage={`Dzēst aptauju "${poll.question}"?`}
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {poll.options.map((option) => (
                    <span
                      key={option.id}
                      className="rounded-full bg-[#e8e8e8] px-3 py-1 text-xs text-black"
                    >
                      {option.label} · {option.votes}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
