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

/** Compact "Rezultatīvākie spēlētāji" list — styled to match
 *  upcoming-birthdays.tsx exactly (same card shell, divide-y rows, a
 *  ring-highlighted leader row) since the two sit side by side on the
 *  homepage, directly under the Komandas panel. */
export async function TopScorersList({
  className,
}: { className?: string } = {}) {
  const scorers = await getTopScorers(3);
  if (scorers.length === 0) return null;

  return (
    <div
      className={cn(
        "h-full pt-4 pr-4 pb-4 pl-4 sm:rounded-2xl sm:bg-white sm:pt-8 sm:pr-5 sm:pb-5 sm:pl-8",
        className,
      )}
    >
      <h3 className="text-3xl tracking-[-0.02em] text-club-navy sm:text-4xl">
        Bombardieri
      </h3>

      <div className="mt-4 flex flex-col divide-y divide-slate-100">
        {scorers.map((scorer) => (
          <div
            key={scorer.id}
            className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-club-gray-light sm:h-28 sm:w-28">
              {scorer.photoUrl ? (
                <Image
                  src={scorer.photoUrl}
                  alt={scorer.name}
                  fill
                  sizes="(min-width: 640px) 112px, 96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserRound
                    className="h-9 w-9 text-club-muted"
                    strokeWidth={1.5}
                  />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-club-navy">
                {scorer.name}
              </p>
              <div className="mt-0.5 flex flex-col">
                {scorer.teamBreakdown.map((entry) => (
                  <p
                    key={entry.teamName}
                    className="truncate text-sm text-slate-400"
                  >
                    {entry.teamName} - {entry.goals}
                  </p>
                ))}
              </div>
            </div>

            <span className="shrink-0 text-lg font-semibold text-club-navy">
              {scorer.totalGoals}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
