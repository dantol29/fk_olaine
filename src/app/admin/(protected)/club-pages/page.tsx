import { asc } from "drizzle-orm";
import { Pencil } from "lucide-react";
import Link from "next/link";

import { AdminSearch } from "@/components/admin/admin-search";
import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";
import { clubPages } from "@/db/schema";
import { deleteClubPage } from "./actions";

export default async function AdminClubPagesPage() {
  const pages = await db.select().from(clubPages).orderBy(asc(clubPages.displayOrder), asc(clubPages.title));
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-black">Kluba lapas</h1>
          <p className="mt-1 text-sm text-black/55">Pārvaldi lapas, kas redzamas izvēlnē “Klubs”.</p>
        </div>
        <Link href="/admin/club-pages/new" className="shrink-0 rounded-none bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark">+ Pievienot</Link>
      </div>
      <AdminSearch placeholder="Meklēt kluba lapas…" />
      <table className="w-full overflow-hidden rounded-none bg-white text-left text-sm shadow-none">
        <thead><tr className="border-b border-black/15 text-black/45">
          <th className="p-4 font-semibold">Secība</th><th className="p-4 font-semibold">Nosaukums</th>
          <th className="p-4 font-semibold">Saite</th><th className="p-4 font-semibold">Statuss</th><th className="p-4" />
        </tr></thead>
        <tbody>
          {pages.map((page) => (
            <tr key={page.id} data-admin-search-item={`${page.title} ${page.slug}`} className="border-b border-black/10 last:border-0">
              <td className="p-4 text-black/55">{page.displayOrder}</td>
              <td className="p-4 font-semibold text-black">{page.title}</td>
              <td className="p-4 text-black/55">/klubs/{page.slug}</td>
              <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${page.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-[#e8e8e8] text-black/55"}`}>{page.isPublished ? "Publicēta" : "Melnraksts"}</span></td>
              <td className="p-4"><div className="flex items-center justify-end gap-3">
                {page.isPublished && <Link href={`/klubs/${page.slug}`} target="_blank" className="text-sm font-semibold text-club-red hover:underline">Atvērt</Link>}
                <Link href={`/admin/club-pages/${page.id}`} aria-label={`Rediģēt lapu “${page.title}”`} className="flex h-8 w-8 items-center justify-center rounded-none text-black hover:bg-[#f5f5f5]"><Pencil className="h-4 w-4" /></Link>
                <DeleteButton action={deleteClubPage.bind(null, page.id)} confirmMessage={`Dzēst lapu “${page.title}”?`} />
              </div></td>
            </tr>
          ))}
          {pages.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-black/45">Vēl nav izveidota neviena kluba lapa.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
