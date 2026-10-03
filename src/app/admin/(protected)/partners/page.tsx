import { Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { AdminSearch } from "@/components/admin/admin-search";
import { getPartners } from "@/lib/partners-server";

import { deletePartner } from "./actions";

export default async function AdminPartnersPage() {
  const rows = await getPartners();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black">Partneri</h1>
        <Link
          href="/admin/partners/new"
          className="rounded-none bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>
      <AdminSearch placeholder="Meklēt partnerus…" />

      <table className="w-full overflow-hidden rounded-none bg-white text-left text-sm shadow-none">
        <thead>
          <tr className="border-b border-black/15 text-black/45">
            <th className="p-4 font-semibold">Logotips</th>
            <th className="p-4 font-semibold">Nosaukums</th>
            <th className="p-4 font-semibold">Izmērs</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((partner) => (
            <tr data-admin-search-item={`${partner.name} ${partner.size === "lg" ? "Liels" : "Mazs"}`} key={partner.id} className="border-b border-black/10 last:border-0">
              <td className="p-4">
                <Image
                  src={partner.logoUrl}
                  alt={partner.name}
                  width={80}
                  height={48}
                  className="h-10 w-20 rounded-none bg-[#f5f5f5] object-contain p-1"
                />
              </td>
              <td className="p-4 font-semibold text-black">{partner.name}</td>
              <td className="p-4 text-black/55">{partner.size === "lg" ? "Liels" : "Mazs"}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/partners/${partner.id}`}
                    aria-label={`Rediģēt partneri "${partner.name}"`}
                    title="Rediģēt"
                    className="flex h-8 w-8 items-center justify-center rounded-none text-black transition hover:bg-[#f5f5f5]"
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
              <td colSpan={4} className="p-8 text-center text-black/45">
                Nav pievienots neviens partneris.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
