import { Newspaper, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";

import { deleteArticle } from "./actions";

export default async function AdminArticlesPage() {
  const rows = await db.query.articles.findMany({
    with: { team: true },
    orderBy: (articles, { desc }) => [desc(articles.date), desc(articles.createdAt)],
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Jaunumi</h1>
        <Link
          href="/admin/jaunumi/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          Vēl nav neviena raksta.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((article) => (
            <div
              key={article.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative aspect-video bg-club-gray-light">
                {article.image ? (
                  <Image src={article.image} alt={article.title} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Newspaper className="h-10 w-10 text-club-muted" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-club-navy">{article.title}</p>
                <p className="text-xs text-slate-400">{article.date}</p>
                <p className="mt-1 truncate text-xs font-semibold text-club-red">
                  {article.category}
                  {article.team ? ` · ${article.team.name}` : ""}
                </p>
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
                  <Link
                    href={`/admin/jaunumi/${article.id}`}
                    aria-label={`Rediģēt rakstu "${article.title}"`}
                    title="Rediģēt"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton
                    action={deleteArticle.bind(null, article.id)}
                    confirmMessage={`Dzēst rakstu "${article.title}"?`}
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
