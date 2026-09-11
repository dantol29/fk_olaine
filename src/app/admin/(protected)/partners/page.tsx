import { Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { getPartners } from "@/lib/partners-server";

import { deletePartner } from "./actions";

export default async function AdminPartnersPage() {
  const rows = await getPartners();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Partneri</h1>
        <Link
          href="/admin/partners/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Logotips</th>
            <th className="p-4 font-semibold">Nosaukums</th>
            <th className="p-4 font-semibold">Izmērs</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((partner) => (
            <tr key={partner.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4">
                <Image
                  src={partner.logoUrl}
                  alt={partner.name}
                  width={80}
                  height={48}
                  className="h-10 w-20 rounded-lg bg-club-gray-light object-contain p-1"
                />
              </td>
              <td className="p-4 font-semibold text-club-navy">{partner.name}</td>
              <td className="p-4 text-slate-500">{partner.size === "lg" ? "Liels" : "Mazs"}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/partners/${partner.id}`}
                    aria-label={`Rediģēt partneri "${partner.name}"`}
                    title="Rediģēt"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton
                    action={deletePartner.bind(null, partner.id)}
                    confirmMessage={`Dzēst partneri "${partner.name}"?`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center text-slate-400">
                Nav pievienots neviens partneris.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
