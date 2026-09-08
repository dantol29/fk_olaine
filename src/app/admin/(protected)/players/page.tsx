import { Pencil, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";

import { deletePlayer } from "./actions";

export default async function AdminPlayersPage() {
  const rows = await db.query.players.findMany({
    with: { playerTeams: { with: { team: true } } },
    orderBy: (players, { asc }) => [asc(players.name)],
  });

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

      {rows.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          Vēl nav neviena spēlētāja.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((player) => (
            <div
              key={player.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative aspect-square bg-club-gray-light">
                {player.photoUrl ? (
                  <Image src={player.photoUrl} alt={player.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserRound className="h-10 w-10 text-club-muted" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-club-navy">{player.name}</p>
                <p className="text-xs text-slate-400">{player.birthdate}</p>
                <p className="mt-1 truncate text-xs font-semibold text-club-red">
                  {player.playerTeams.map((pt) => pt.team.name).join(", ") || "—"}
                </p>
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
      )}
    </div>
  );
}
