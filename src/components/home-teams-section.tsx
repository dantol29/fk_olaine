import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { db } from "@/db/client";
import { getAllGamesFromDb } from "@/lib/games-server";
import { getAllTrainingsFromDb } from "@/lib/trainings-server";
import { HomeTeamsPanel } from "@/components/home-teams-panel";

export async function getTeamsRoster() {
  const [rows, games, trainings] = await Promise.all([
    db.query.teams.findMany({
      with: {
        playerTeams: { with: { player: true } },
        coachTeams: { with: { coach: true } },
      },
      orderBy: (teams, { asc }) => [asc(teams.name)],
    }),
    getAllGamesFromDb(),
    getAllTrainingsFromDb(),
  ]);

  // A player (or coach) can belong to more than one team — build the full
  // list of team names per person across the whole roster (not just the
  // team this instance of the card happens to render under), so the
  // detail drawer can show all of them.
  const teamNamesByPlayerId = new Map<number, string[]>();
  const teamNamesByCoachId = new Map<number, string[]>();
  for (const team of rows) {
    for (const pt of team.playerTeams) {
      if (!pt.player) continue;
      const list = teamNamesByPlayerId.get(pt.player.id) ?? [];
      list.push(team.name);
      teamNamesByPlayerId.set(pt.player.id, list);
    }
    for (const ct of team.coachTeams) {
      if (!ct.coach) continue;
      const list = teamNamesByCoachId.get(ct.coach.id) ?? [];
      list.push(team.name);
      teamNamesByCoachId.set(ct.coach.id, list);
    }
  }

  return rows.map((team) => ({
    id: team.id,
    name: team.name,
    players: team.playerTeams
      .map((pt) => pt.player)
      .filter((player) => player !== null)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "lv"))
      .map((player) => ({
        id: player.id,
        name: player.name,
        photoUrl: player.photoUrl,
        birthdate: player.birthdate,
        goals: player.goals,
        teamNames: teamNamesByPlayerId.get(player.id) ?? [],
      })),
    coaches: team.coachTeams
      .map((ct) => ct.coach)
      .filter((coach) => coach !== null)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "lv"))
      .map((coach) => ({
        id: coach.id,
        name: coach.name,
        position: coach.position,
        license: coach.license,
        authority: coach.authority,
        photoUrl: coach.photoUrl,
        teamNames: teamNamesByCoachId.get(coach.id) ?? [],
      })),
    games: games.filter((game) => game.teamName === team.name),
    trainings: trainings.filter((training) => training.teamName === team.name),
  }));
}

export async function HomeTeamsSection({ panelClassName }: { panelClassName?: string } = {}) {
  const teams = await getTeamsRoster();
  if (teams.length === 0) return null;

  return (
    <section>
      <div className="mb-5 flex items-center justify-center gap-4 sm:mb-6 sm:justify-between">
        <div className="relative flex min-h-24 min-w-0 flex-1 flex-col items-center justify-center sm:min-h-32 sm:items-start">
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:text-8xl"
          >
            Komandas
          </span>
          <h2 className="relative text-center text-3xl tracking-[-0.02em] text-club-navy sm:text-left sm:text-4xl">
            Komandas
          </h2>
        </div>
        <Link
          href="/komandas"
          className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 py-1.5 pr-1.5 pl-4 text-sm font-semibold text-club-navy transition-colors hover:border-slate-300 sm:flex"
        >
          Visas komandas
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 sm:h-8 sm:w-8">
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
        </Link>
      </div>

      <HomeTeamsPanel teams={teams} className={panelClassName} />
    </section>
  );
}
