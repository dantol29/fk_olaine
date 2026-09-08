import { Pencil, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";

import { deleteCoach } from "./actions";

export default async function AdminCoachesPage() {
  const rows = await db.query.coaches.findMany({
    with: { coachTeams: { with: { team: true } } },
    orderBy: (coaches, { asc }) => [asc(coaches.name)],
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Treneri</h1>
        <Link
          href="/admin/coaches/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          Vēl nav neviena trenera.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((coach) => (
            <div
              key={coach.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative aspect-square bg-club-gray-light">
                {coach.photoUrl ? (
                  <Image src={coach.photoUrl} alt={coach.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserRound className="h-10 w-10 text-club-muted" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-club-navy">{coach.name}</p>
                <p className="text-xs text-slate-400">{coach.position}</p>
                <p className="mt-1 truncate text-xs font-semibold text-club-red">
                  {coach.coachTeams.map((ct) => ct.team.name).join(", ") || "—"}
                </p>
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
                  <Link
                    href={`/admin/coaches/${coach.id}`}
                    aria-label={`Rediģēt treneri "${coach.name}"`}
                    title="Rediģēt"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton
                    action={deleteCoach.bind(null, coach.id)}
                    confirmMessage={`Dzēst treneri "${coach.name}"?`}
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
