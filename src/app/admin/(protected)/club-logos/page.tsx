import { Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";
import { clubLogos } from "@/db/schema";

import { deleteClubLogo } from "./actions";

export default async function AdminClubLogosPage() {
  const rows = await db.select().from(clubLogos).orderBy(clubLogos.name);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Klubu logo</h1>
        <Link
          href="/admin/club-logos/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          Vēl nav neviena kluba logo.
        </p>
      ) : (
        <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400">
              <th className="p-4" />
              <th className="p-4 font-semibold">Nosaukums</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {rows.map((club) => (
              <tr key={club.id} className="border-b border-slate-100 last:border-0">
                <td className="p-4">
                  <Image
                    src={club.logoUrl}
                    alt={club.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-contain"
                  />
                </td>
                <td className="p-4 font-semibold text-club-navy">{club.name}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/club-logos/${club.id}`}
                      aria-label={`Rediģēt klubu "${club.name}"`}
                      title="Rediģēt"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteButton
                      action={deleteClubLogo.bind(null, club.id)}
                      confirmMessage={`Dzēst kluba "${club.name}" logo?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
