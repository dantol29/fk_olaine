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
          <h1 className="text-2xl font-extrabold text-club-navy">Kluba lapas</h1>
          <p className="mt-1 text-sm text-slate-500">Pārvaldi lapas, kas redzamas izvēlnē “Klubs”.</p>
        </div>
        <Link href="/admin/club-pages/new" className="shrink-0 rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark">+ Pievienot</Link>
      </div>
      <AdminSearch placeholder="Meklēt kluba lapas…" />
      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead><tr className="border-b border-slate-200 text-slate-400">
          <th className="p-4 font-semibold">Secība</th><th className="p-4 font-semibold">Nosaukums</th>
          <th className="p-4 font-semibold">Saite</th><th className="p-4 font-semibold">Statuss</th><th className="p-4" />
        </tr></thead>
        <tbody>
          {pages.map((page) => (
            <tr key={page.id} data-admin-search-item={`${page.title} ${page.slug}`} className="border-b border-slate-100 last:border-0">
              <td className="p-4 text-slate-500">{page.displayOrder}</td>
              <td className="p-4 font-semibold text-club-navy">{page.title}</td>
              <td className="p-4 text-slate-500">/klubs/{page.slug}</td>
              <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${page.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{page.isPublished ? "Publicēta" : "Melnraksts"}</span></td>
              <td className="p-4"><div className="flex items-center justify-end gap-3">
                {page.isPublished && <Link href={`/klubs/${page.slug}`} target="_blank" className="text-sm font-semibold text-club-red hover:underline">Atvērt</Link>}
                <Link href={`/admin/club-pages/${page.id}`} aria-label={`Rediģēt lapu “${page.title}”`} className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy hover:bg-club-gray-light"><Pencil className="h-4 w-4" /></Link>
                <DeleteButton action={deleteClubPage.bind(null, page.id)} confirmMessage={`Dzēst lapu “${page.title}”?`} />
              </div></td>
            </tr>
          ))}
          {pages.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">Vēl nav izveidota neviena kluba lapa.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
