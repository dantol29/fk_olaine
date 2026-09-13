"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";

import { cn } from "@/lib/utils";
import { voteForOption } from "@/lib/poll-actions";

const STORAGE_KEY_PREFIX = "fk-olaine-poll-voted-for-";

export type PollOption = {
  id: number;
  label: string;
  votes: number;
};

export type Poll = {
  id: number;
  question: string;
  options: PollOption[];
};

function useVote(poll: Poll) {
  const storageKey = `${STORAGE_KEY_PREFIX}${poll.id}`;
  const [votedForId, setVotedForId] = useState<number | null | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      setVotedForId(stored ? Number(stored) : null);
    } catch {
      setVotedForId(null);
    }
    // Only re-check on mount / if this card starts representing a
    // different poll (its id changed).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function handleVote(optionId: number) {
    setVotedForId(optionId);
    try {
      window.localStorage.setItem(storageKey, String(optionId));
    } catch {
      // localStorage unavailable — vote still counts, just won't be
      // remembered as "already voted" on this device.
    }
    startTransition(() => {
      voteForOption(optionId);
    });
  }

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const showResults = votedForId !== undefined && Boolean(votedForId);
  const leaderId =
    totalVotes > 0
      ? poll.options.reduce((leader, option) => (option.votes > leader.votes ? option : leader)).id
      : null;

  return { isPending, handleVote, totalVotes, showResults, leaderId };
}

/** The options list — vote buttons before voting, a thin-bar result list
 *  (label above, bar + percentage below, red fill only on the leading
 *  option) after. Shared by the hero and plain card variants so both stay
 *  visually identical apart from the hero's background photo. */
function PollOptionsList({
  options,
  totalVotes,
  leaderId,
  showResults,
  isPending,
  onVote,
}: {
  options: PollOption[];
  totalVotes: number;
  leaderId: number | null;
  showResults: boolean;
  isPending: boolean;
  onVote: (optionId: number) => void;
}) {
  return (
    <>
      {options.map((option) => {
        const percent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
        const isLeader = option.id === leaderId;

        if (!showResults) {
          return (
            <button
              key={option.id}
              type="button"
              disabled={isPending}
              onClick={() => onVote(option.id)}
              className="rounded-full bg-slate-100 px-4 py-2 text-left text-sm font-semibold text-club-navy transition hover:bg-slate-200 disabled:opacity-50"
            >
              {option.label}
            </button>
          );
        }

        return (
          <div key={option.id}>
            <p className="truncate text-sm font-semibold text-club-navy">{option.label}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500",
                    isLeader ? "bg-club-red" : "bg-slate-300",
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="shrink-0 text-xs font-semibold text-slate-400">{percent}%</span>
            </div>
          </div>
        );
      })}
    </>
  );
}

function HeroPollCard({
  poll,
  imageSrc,
  className,
}: {
  poll: Poll;
  imageSrc: string;
  className?: string;
}) {
  const { isPending, handleVote, totalVotes, showResults, leaderId } = useVote(poll);

  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl sm:flex-row",
        className,
      )}
    >
      <div className="relative flex min-h-[16rem] flex-col justify-end p-4 sm:order-2 sm:w-3/5 sm:p-8">
        <Image src={imageSrc} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

        <div className="relative z-10">
          <p className="text-2xl text-white sm:text-3xl">{poll.question}</p>
          <p className="mt-1 text-sm text-white/70">{totalVotes} balsis</p>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-3 p-4 sm:order-1 sm:w-2/5 sm:bg-white sm:p-8">
        <PollOptionsList
          options={poll.options}
          totalVotes={totalVotes}
          leaderId={leaderId}
          showResults={showResults}
          isPending={isPending}
          onVote={handleVote}
        />
      </div>
    </div>
  );
}

function PlainPollCard({ poll, className }: { poll: Poll; className?: string }) {
  const { isPending, handleVote, totalVotes, showResults, leaderId } = useVote(poll);

  return (
    <div
      className={cn(
        "flex h-full flex-col justify-end rounded-2xl p-4 sm:bg-white sm:p-8",
        className,
      )}
    >
      <div>
        <p className="text-2xl text-club-navy sm:text-3xl">{poll.question}</p>
        <p className="mt-1 text-sm text-slate-400">{totalVotes} balsis</p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <PollOptionsList
          options={poll.options}
          totalVotes={totalVotes}
          leaderId={leaderId}
          showResults={showResults}
          isPending={isPending}
          onVote={handleVote}
        />
      </div>
    </div>
  );
}

export function HomePollCard({
  poll,
  className,
  imageSrc,
}: {
  poll: Poll;
  className?: string;
  /** When set, renders the "big" hero variant — a background photo (with
   *  question + vote count) on the left, a plain white results panel on
   *  the right — instead of the plain white card. */
  imageSrc?: string;
}) {
  if (imageSrc) {
    return <HeroPollCard poll={poll} imageSrc={imageSrc} className={className} />;
  }
  return <PlainPollCard poll={poll} className={className} />;
}
