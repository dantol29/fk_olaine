import Image from "next/image";
import { UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { db } from "@/db/client";

type TopScorer = {
  id: number;
  name: string;
  photoUrl: string | null;
  totalGoals: number;
  /** Per-team breakdown — a player who plays across leagues can have a
   *  different tally in each, so the total alone can be misleading. */
  teamBreakdown: { teamName: string; goals: number }[];
};

async function getTopScorers(limit: number): Promise<TopScorer[]> {
  const rows = await db.query.players.findMany({
    with: { playerTeams: { with: { team: true } } },
  });

  return rows
    .map((player) => {
      const teamBreakdown = player.playerTeams
        .filter((pt) => pt.team && pt.goals > 0)
        .map((pt) => ({ teamName: pt.team!.name, goals: pt.goals }));
      const totalGoals = teamBreakdown.reduce(
        (sum, entry) => sum + entry.goals,
        0,
      );
      return {
        id: player.id,
        name: player.name,
        photoUrl: player.photoUrl,
        totalGoals,
        teamBreakdown,
      };
    })
    .filter((player) => player.totalGoals > 0)
    .sort((a, b) => b.totalGoals - a.totalGoals)
    .slice(0, limit);
}

export async function TopScorersList({
  className,
}: { className?: string } = {}) {
  const scorers = await getTopScorers(3);
  if (scorers.length === 0) return null;

  return (
    <section aria-labelledby="top-scorers-heading" className={cn("h-full bg-white text-black", className)}>
      <div className="flex items-end justify-between gap-4 border-b-2 border-black pb-5">
        <h3 id="top-scorers-heading" className="text-2xl font-semibold uppercase sm:text-3xl">Bombardieri</h3>
        <span className="pb-1 text-xs text-black/45 uppercase">Vārti</span>
      </div>
      <ol className="divide-y divide-black/10">
        {scorers.map((scorer, index) => (
          <li key={scorer.id} className="flex items-center gap-3 py-6 sm:gap-5">
            <span aria-label={`${index + 1}. vieta`} className={cn("w-7 shrink-0 text-2xl leading-none font-semibold tabular-nums", index === 0 ? "text-club-red" : "text-black/25")}>{String(index + 1).padStart(2, "0")}</span>
            <div className="relative h-24 w-16 shrink-0 overflow-hidden bg-[#f5f5f5] sm:h-28 sm:w-20">
              {scorer.photoUrl ? <Image src={scorer.photoUrl} alt="" fill sizes="80px" className="object-contain object-bottom" /> : <div className="flex h-full items-center justify-center"><UserRound className="size-8 text-black/20" strokeWidth={1} /></div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base leading-tight font-semibold sm:text-xl">{scorer.name}</p>
              <div className="mt-2 space-y-1">
                {scorer.teamBreakdown.map((entry) => <p key={entry.teamName} className="text-xs text-black/45">{entry.teamName}<span className="mx-1.5 text-black/20">/</span><span className="tabular-nums">{entry.goals}</span></p>)}
              </div>
            </div>
            <span className={cn("ml-auto shrink-0 text-4xl leading-none font-semibold tabular-nums sm:text-5xl", index === 0 ? "text-club-red" : "text-black")}>{scorer.totalGoals}<span className="sr-only"> vārti</span></span>
          </li>
        ))}
      </ol>
    </section>
  );
}
