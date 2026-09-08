import { eq } from "drizzle-orm";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";
import { games, teams } from "@/db/schema";

import { deleteGame } from "./actions";

export default async function AdminGamesPage() {
  const rows = await db
    .select({
      id: games.id,
      homeTeam: games.homeTeam,
      awayTeam: games.awayTeam,
      date: games.date,
      startTime: games.startTime,
      endTime: games.endTime,
      location: games.location,
      league: games.league,
      teamName: teams.name,
    })
    .from(games)
    .innerJoin(teams, eq(games.teamId, teams.id))
    .orderBy(games.date);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Spēles</h1>
        <Link
          href="/admin/games/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Datums</th>
            <th className="p-4 font-semibold">Laiks</th>
            <th className="p-4 font-semibold">Komanda</th>
            <th className="p-4 font-semibold">Mājinieki</th>
            <th className="p-4 font-semibold">Viesi</th>
            <th className="p-4 font-semibold">Sacensības</th>
            <th className="p-4 font-semibold">Vieta</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((game) => (
            <tr key={game.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 text-club-navy">{game.date}</td>
              <td className="p-4 text-slate-500">
                {game.startTime}–{game.endTime}
              </td>
              <td className="p-4 font-semibold text-club-navy">{game.teamName}</td>
              <td className="p-4 text-slate-500">{game.homeTeam}</td>
              <td className="p-4 text-slate-500">{game.awayTeam}</td>
              <td className="p-4 text-slate-500">{game.league ?? "Draudzības spēle"}</td>
              <td className="p-4 text-slate-500">{game.location}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/games/${game.id}`}
                    className="text-sm font-semibold text-club-navy hover:underline"
                  >
                    Rediģēt
                  </Link>
                  <DeleteButton
                    action={deleteGame.bind(null, game.id)}
                    confirmMessage={`Dzēst spēli "${game.homeTeam} – ${game.awayTeam}"?`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="p-4 text-center text-slate-400">
                Vēl nav nevienas spēles.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
