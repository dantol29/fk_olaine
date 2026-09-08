import { Pencil, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";

import { deletePlayer } from "./actions";

export default async function AdminPlayersPage() {
  const teamRows = await db.query.teams.findMany({
    with: { playerTeams: { with: { player: true } } },
    orderBy: (teams, { asc }) => [asc(teams.name)],
  });

  const teamsWithPlayers = teamRows.map((team) => ({
    id: team.id,
    name: team.name,
    players: team.playerTeams
      .map((pt) => pt.player)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "lv")),
  }));

  const totalPlayers = teamsWithPlayers.reduce((sum, team) => sum + team.players.length, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Spēlētāji</h1>
        <Link
          href="/admin/players/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      {totalPlayers === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          Vēl nav neviena spēlētāja.
        </p>
      ) : (
        teamsWithPlayers.map((team) =>
          team.players.length === 0 ? null : (
            <div key={team.id} className="mb-8">
              <div className="mb-3 flex items-baseline gap-3">
                <h2 className="text-lg font-bold text-club-navy">{team.name}</h2>
                <span className="text-sm text-slate-400">{team.players.length} spēlētāji</span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {team.players.map((player) => (
                  <div
                    key={player.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="relative aspect-square bg-club-gray-light">
                      {player.photoUrl ? (
                        <Image
                          src={player.photoUrl}
                          alt={player.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <UserRound className="h-10 w-10 text-club-muted" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-semibold text-club-navy">
                        {player.name}
                      </p>
                      <p className="text-xs text-slate-400">{player.birthdate}</p>
                      <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
                        <Link
                          href={`/admin/players/${player.id}`}
                          aria-label={`Rediģēt spēlētāju "${player.name}"`}
                          title="Rediģēt"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <DeleteButton
                          action={deletePlayer.bind(null, player.id)}
                          confirmMessage={`Dzēst spēlētāju "${player.name}"?`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        )
      )}
    </div>
  );
}
