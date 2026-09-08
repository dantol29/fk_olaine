import { eq } from "drizzle-orm";
import { Pencil } from "lucide-react";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";
import { players, teams } from "@/db/schema";

import { deletePlayer } from "./actions";

export default async function AdminPlayersPage() {
  const rows = await db
    .select({
      id: players.id,
      name: players.name,
      birthdate: players.birthdate,
      teamName: teams.name,
    })
    .from(players)
    .innerJoin(teams, eq(players.teamId, teams.id))
    .orderBy(teams.name, players.name);

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

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Vārds, uzvārds</th>
            <th className="p-4 font-semibold">Dzimšanas datums</th>
            <th className="p-4 font-semibold">Komanda</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((player) => (
            <tr key={player.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 font-semibold text-club-navy">{player.name}</td>
              <td className="p-4 text-slate-500">{player.birthdate}</td>
              <td className="p-4 text-slate-500">{player.teamName}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
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
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-slate-400">
                Vēl nav neviena spēlētāja.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
