"use client";

import { Check } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { cn } from "@/lib/utils";
import { voteForOption } from "@/lib/poll-actions";
import styles from "./home-poll-card.module.css";

export type PollVariant = "classic" | "dark" | "split";

const STORAGE_KEY_PREFIX = "fk-olaine-poll-voted-for-";
export type PollOption = { id: number; label: string; votes: number };
export type Poll = { id: number; question: string; options: PollOption[] };

export function HomePollCard({ poll, className, variant = "classic", previewOnly = false }: { poll: Poll; className?: string; variant?: PollVariant; previewOnly?: boolean }) {
  const [votedForId, setVotedForId] = useState<number | null | undefined>(previewOnly ? null : undefined);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [previewResults, setPreviewResults] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const storageKey = `${STORAGE_KEY_PREFIX}${poll.id}`;

  useEffect(() => {
    if (previewOnly) return;
    const timeout = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(storageKey);
        setVotedForId(stored ? Number(stored) : null);
      } catch {
        setVotedForId(null);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [storageKey, previewOnly]);

  const hasVoted = votedForId != null;
  const showResults = hasVoted || previewResults;
  const options = previewOnly && hasVoted ? poll.options.map((option) => ({ ...option, votes: option.votes + (option.id === votedForId ? 1 : 0) })) : poll.options;
  const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);
  const highestVotes = Math.max(0, ...options.map((option) => option.votes));

  function submitVote() {
    if (selectedId === null || votedForId !== null || isPending) return;
    const optionId = selectedId;
    setError("");
    if (previewOnly) { setVotedForId(optionId); return; }
    startTransition(async () => {
      try {
        await voteForOption(optionId);
        setVotedForId(optionId);
        try { window.localStorage.setItem(storageKey, String(optionId)); } catch { /* Voting remains available without local storage. */ }
      } catch {
        setError("Balsojumu neizdevās saglabāt. Mēģini vēlreiz.");
      }
    });
  }

  return <section aria-labelledby={`poll-question-${poll.id}`} className={cn(styles.poll, styles[variant], "mx-auto max-w-[860px] border border-black/15 border-t-4 border-t-club-red bg-white p-6 text-black sm:p-10", className)}>
    <header className={styles.header}>
    <h2 id={`poll-question-${poll.id}`} className="text-2xl leading-tight font-semibold sm:text-3xl">{poll.question}</h2>
    <p className={cn(styles.muted, "mt-3 text-sm text-black/50")}>{hasVoted ? "Paldies par balsojumu!" : showResults ? "Pašreizējie rezultāti" : "Izvēlies vienu atbildi"}</p>
    </header>
    <div className={styles.body}>
    {showResults ? <div className="mt-7 space-y-5">
      {options.map((option) => {
        const percent = totalVotes ? Math.round(option.votes / totalVotes * 100) : 0;
        const chosen = votedForId === option.id;
        return <div key={option.id}>
          <div className="mb-2 flex items-start justify-between gap-4 text-sm sm:text-base">
            <p className="flex items-start gap-2 font-medium">{option.label}{chosen && <Check className="mt-0.5 size-4 shrink-0 text-club-red" aria-label="Tava atbilde" />}</p>
            <span className="shrink-0 font-semibold tabular-nums">{percent}%</span>
          </div>
          <div className={cn(styles.track, "h-3 overflow-hidden bg-[#e8e8e8]")}><div className={cn(styles.fill, "h-full transition-[width] duration-500 motion-reduce:transition-none", option.votes === highestVotes && highestVotes > 0 ? "bg-club-red" : "bg-black/35")} style={{ width: `${percent}%` }} /></div>
          <p className={cn(styles.muted, "mt-1 text-xs text-black/45")}>{option.votes} balsis</p>
        </div>;
      })}
    </div> : <form onSubmit={(event) => { event.preventDefault(); submitVote(); }} className="mt-7" aria-busy={isPending}>
      <fieldset disabled={isPending || votedForId === undefined} className="space-y-2 disabled:opacity-50">
        <legend className="sr-only">Atbilžu varianti</legend>
        {options.map((option) => <label key={option.id} data-selected={selectedId === option.id || undefined} className={cn(styles.option, "flex min-h-12 cursor-pointer items-center gap-3 border px-4 py-3 text-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-black sm:text-base", selectedId === option.id ? "border-black bg-[#f5f5f5]" : "border-black/15 hover:border-black/40")}>
          <input type="radio" name={`poll-${poll.id}`} value={option.id} checked={selectedId === option.id} onChange={() => setSelectedId(option.id)} className="size-4 shrink-0 accent-black" />
          <span>{option.label}</span>
        </label>)}
      </fieldset>
      {error && <p role="alert" className="mt-4 text-sm text-club-red">{error}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button type="submit" disabled={selectedId === null || isPending || votedForId === undefined} className="motion-action flex min-h-11 min-w-32 items-center justify-center bg-club-red px-6 text-sm font-semibold text-white uppercase hover:bg-club-red-dark disabled:cursor-default disabled:opacity-40">{isPending ? "Saglabā..." : "Balsot"}</button>
        <button type="button" onClick={() => setPreviewResults(true)} disabled={isPending} className={cn(styles.secondary, "min-h-11 text-sm text-black/60 underline-offset-4 hover:underline")}>Skatīt rezultātus</button>
      </div>
    </form>}
    <div className={cn(styles.footer, "mt-6 flex items-center justify-between gap-4 border-t border-black/10 pt-4 text-xs text-black/45")}>
      <p className="tabular-nums">Kopā: {totalVotes} balsis</p>
      {showResults && !hasVoted && <button type="button" onClick={() => setPreviewResults(false)} className={cn(styles.secondary, "min-h-9 text-sm font-medium text-black hover:underline")}>Atpakaļ pie balsošanas</button>}
    </div>
    </div>
    <p role="status" className="sr-only">{isPending ? "Balsojums tiek saglabāts." : hasVoted ? "Tavs balsojums ir saglabāts." : ""}</p>
  </section>;
}
