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
    <div
      className={cn(
        "h-full bg-black p-6 text-white sm:p-8",
        className,
      )}
    >
      <h3 className="text-2xl font-semibold uppercase sm:text-3xl">
        Bombardieri
      </h3>

      <div className="mt-6 flex flex-col divide-y divide-white/20">
        {scorers.map((scorer, index) => (
          <div
            key={scorer.id}
            className="flex items-center gap-3 py-5 sm:gap-4"
          >
            <span className="w-5 shrink-0 text-sm tabular-nums text-white/50">{String(index + 1).padStart(2, "0")}</span>
            <div className="relative size-14 shrink-0 overflow-hidden bg-white/10 sm:size-16">
              {scorer.photoUrl ? (
                <Image
                  src={scorer.photoUrl}
                  alt={scorer.name}
                  fill
                  sizes="(min-width: 640px) 64px, 56px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserRound
                    className="size-8 text-white/40"
                    strokeWidth={1.5}
                  />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold leading-snug sm:text-lg">
                {scorer.name}
              </p>
              <div className="mt-0.5 flex flex-col">
                {scorer.teamBreakdown.map((entry) => (
                  <p
                    key={entry.teamName}
                    className="text-xs text-white/50 sm:text-sm"
                  >
                    {entry.teamName} - {entry.goals}
                  </p>
                ))}
              </div>
            </div>

            <div className="ml-auto w-12 shrink-0 text-right">
              <span className="block text-3xl font-semibold leading-none tabular-nums text-club-red sm:text-4xl">{scorer.totalGoals}</span>
              <span className="mt-1 block text-xs text-white/50">Vārti</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
