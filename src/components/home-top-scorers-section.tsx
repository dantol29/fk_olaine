import Image from "next/image";
import { UserRound } from "lucide-react";

import { db } from "@/db/client";

type TopScorer = {
  id: number;
  name: string;
  photoUrl: string | null;
  goals: number;
  teamName: string | null;
};

async function getTopScorers(limit: number): Promise<TopScorer[]> {
  const rows = await db.query.players.findMany({
    with: { playerTeams: { with: { team: true } } },
  });

  return rows
    .filter((player) => player.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, limit)
    .map((player) => ({
      id: player.id,
      name: player.name,
      photoUrl: player.photoUrl,
      goals: player.goals,
      teamName: player.playerTeams[0]?.team.name ?? null,
    }));
}

export async function HomeTopScorersSection() {
  const scorers = await getTopScorers(8);
  if (scorers.length === 0) return null;

  return (
    <section>
      <div className="relative flex min-h-24 flex-col items-center justify-center sm:min-h-32 sm:items-start">
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:text-8xl"
        >
          Rezultāti
        </span>
        <h2 className="relative text-center text-3xl tracking-[-0.02em] text-club-navy sm:text-left sm:text-4xl">
          Rezultatīvākie spēlētāji
        </h2>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:mt-8 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {scorers.map((scorer) => (
          <div
            key={scorer.id}
            className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-[1.5rem] bg-club-navy"
          >
            {scorer.photoUrl ? (
              <Image
                src={scorer.photoUrl}
                alt={scorer.name}
                fill
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-club-gray-light">
                <UserRound className="h-16 w-16 text-club-muted" strokeWidth={1.25} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

            <span className="absolute top-4 right-4 z-10 flex items-baseline gap-1 rounded-full bg-club-red px-3 py-1.5 text-white">
              <span className="text-lg leading-none font-extrabold">{scorer.goals}</span>
              <span className="text-[10px] font-bold tracking-wide uppercase">vārti</span>
            </span>

            <div className="relative z-10 p-5">
              <h3 className="text-xl text-white">{scorer.name}</h3>
              {scorer.teamName && <p className="mt-0.5 text-sm text-white/70">{scorer.teamName}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
