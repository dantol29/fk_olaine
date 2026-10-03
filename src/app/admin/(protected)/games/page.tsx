import { eq } from "drizzle-orm";
import { Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { AdminSearch } from "@/components/admin/admin-search";
import { db } from "@/db/client";
import { games, teams } from "@/db/schema";
import { resolveClubLogos } from "@/lib/club-logos";
import { colorFor, initialsFor } from "@/lib/games";
import { cn } from "@/lib/utils";

import { deleteGame } from "./actions";

function formatDateDisplay(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}.${month}.${year}`;
}

function ClubBadge({ name, logo }: { name: string; logo: string | null }) {
  return (
    <span className="flex items-center gap-2">
      {logo ? (
        <Image
          src={logo}
          alt={name}
          width={20}
          height={20}
          className="h-5 w-5 shrink-0 rounded-full object-contain"
        />
      ) : (
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold text-white",
            colorFor(name),
          )}
        >
          {initialsFor(name)}
        </span>
      )}
      {name}
    </span>
  );
}

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

  const logos = await resolveClubLogos(rows.flatMap((row) => [row.homeTeam, row.awayTeam]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black">Spēles</h1>
        <Link
          href="/admin/games/new"
          className="rounded-none bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>
      <AdminSearch placeholder="Meklēt spēles…" />

      <table className="w-full overflow-hidden rounded-none bg-white text-left text-sm shadow-none">
        <thead>
          <tr className="border-b border-black/15 text-black/45">
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
          {rows.map((game) => {
            const dateDisplay = formatDateDisplay(game.date);
            return (
            <tr data-admin-search-item={`${game.date} ${dateDisplay} ${game.startTime} ${game.teamName} ${game.homeTeam} ${game.awayTeam} ${game.league ?? ""} ${game.location}`} key={game.id} className="border-b border-black/10 last:border-0">
              <td className="p-4 text-black">{dateDisplay}</td>
              <td className="p-4 text-black/55">
                {game.startTime}–{game.endTime}
              </td>
              <td className="p-4 font-semibold text-black">{game.teamName}</td>
              <td className="p-4 text-black/55">
                <ClubBadge name={game.homeTeam} logo={logos.get(game.homeTeam) ?? null} />
              </td>
              <td className="p-4 text-black/55">
                <ClubBadge name={game.awayTeam} logo={logos.get(game.awayTeam) ?? null} />
              </td>
              <td className="p-4 text-black/55">{game.league ?? "Draudzības spēle"}</td>
              <td className="p-4 text-black/55">{game.location}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/games/${game.id}`}
                    aria-label={`Rediģēt spēli "${game.homeTeam} – ${game.awayTeam}"`}
                    title="Rediģēt"
                    className="flex h-8 w-8 items-center justify-center rounded-none text-black transition hover:bg-[#f5f5f5]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton
                    action={deleteGame.bind(null, game.id)}
                    confirmMessage={`Dzēst spēli "${game.homeTeam} – ${game.awayTeam}"?`}
                  />
                </div>
              </td>
            </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="p-4 text-center text-black/45">
                Vēl nav nevienas spēles.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
