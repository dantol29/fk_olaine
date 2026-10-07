import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { db } from "@/db/client";
import { getAllGamesFromDb } from "@/lib/games-server";
import { getAllTrainingsFromDb } from "@/lib/trainings-server";
import { HomeTeamsShowcase } from "@/components/home-teams-showcase";

export async function getTeamsRoster() {
  const [rows, games, trainings] = await Promise.all([
    db.query.teams.findMany({
      with: {
        playerTeams: { with: { player: true } },
        coachTeams: { with: { coach: true } },
      },
      orderBy: (teams, { asc, desc }) => [desc(teams.isMain), asc(teams.name)],
    }),
    getAllGamesFromDb(),
    getAllTrainingsFromDb(),
  ]);

  // A player (or coach) can belong to more than one team — build the full
  // list of team associations per person across the whole roster (not just
  // the team this instance of the card happens to render under), so the
  // detail drawer can show all of them. Goals are tracked per player-team
  // pair (see playerTeams.goals), since a player can score a different
  // tally in each league they play in.
  const goalsByPlayerId = new Map<number, { name: string; goals: number }[]>();
  const teamNamesByCoachId = new Map<number, string[]>();
  for (const team of rows) {
    for (const pt of team.playerTeams) {
      if (!pt.player) continue;
      const list = goalsByPlayerId.get(pt.player.id) ?? [];
      list.push({ name: team.name, goals: pt.goals });
      goalsByPlayerId.set(pt.player.id, list);
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
    isMain: team.isMain,
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
        number: player.number,
        position: player.position,
        nationality: player.nationality,
        teams: goalsByPlayerId.get(player.id) ?? [],
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
  const mainTeam = teams.find((team) => team.isMain);
  if (!mainTeam) return null;

  return (
    <section className="mx-auto max-w-[1280px]">
      <HomeTeamsShowcase teams={[mainTeam]} className={panelClassName} />
      <div className="mt-6 flex justify-center">
        <Link href="/komandas" className="motion-action flex min-h-11 items-center gap-3 border-2 border-black px-5 text-sm font-semibold text-black uppercase hover:bg-black hover:text-white focus-visible:outline-black">Visas komandas<ArrowRight className="action-arrow size-4" aria-hidden="true" /></Link>
      </div>
    </section>
  );
}
