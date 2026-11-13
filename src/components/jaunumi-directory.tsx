"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Newspaper } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Article, ArticleCategory } from "@/lib/jaunumi";

const CATEGORIES: ArticleCategory[] = [
  "Klubs",
  "Komandas",
  "Spēles",
  "Treniņi",
  "Pasākumi",
];

const PAGE_SIZE = 6;

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const keep = new Set([1, total, current - 1, current, current + 1]);
  const pages = [...keep].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  let previous = 0;
  for (const page of pages) {
    if (previous && page - previous > 1) result.push("…");
    result.push(page);
    previous = page;
  }
  return result;
}

export function JaunumiDirectory({ articles }: { articles: Article[] }) {
  const [activeCategory, setActiveCategory] = useState<
    ArticleCategory | "Visi"
  >("Visi");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return articles.filter(
      (article) => activeCategory === "Visi" || article.category === activeCategory,
    );
  }, [articles, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Reset to page 1 whenever the filters change (adjusting state during
  // render, per https://react.dev/learn/you-might-not-need-an-effect,
  // instead of a setState-in-effect that would trigger a second render).
  const filterKey = activeCategory;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const currentPage = Math.min(page, totalPages);

  const pageArticles = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  return (
    <div className="public-news bg-club-navy">
      <nav aria-label="Jaunumu kategorijas" className="border-b border-white/10 bg-club-navy px-6 sm:px-10 lg:px-14">
        <div className="mx-auto flex max-w-[1920px] gap-6 overflow-x-auto sm:gap-10">
          {(["Visi", ...CATEGORIES] as const).map((category) => (
            <button key={category} type="button" onClick={() => setActiveCategory(category)} aria-pressed={activeCategory === category} className={cn(
              "relative flex h-16 shrink-0 items-center text-base font-medium text-white/60 uppercase hover:text-white focus-visible:outline-white sm:text-lg",
              activeCategory === category && "text-white after:absolute after:inset-x-0 after:bottom-2 after:h-[3px] after:bg-club-red",
            )}>{category}</button>
          ))}
        </div>
      </nav>

      <section aria-labelledby="all-news-heading" className="px-6 pt-12 pb-10 sm:px-10 sm:pt-14 lg:px-14">
        <div className="mx-auto max-w-[1920px]">
          <h2 id="all-news-heading" className="mb-8 text-4xl leading-tight font-semibold text-white uppercase sm:mb-10 sm:text-5xl lg:text-6xl">{activeCategory === "Visi" ? "Visi jaunumi" : activeCategory}</h2>

          {pageArticles.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pageArticles.map((article) => (
                <Link key={article.slug} href={`/jaunumi/${article.slug}`} className="card-hover flex min-w-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-club-navy-light text-white focus-visible:outline-white">
                  <div className="relative aspect-video w-full shrink-0 overflow-hidden">
                    <Image src={article.image} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="card-hover-image object-cover" />
                  </div>
                  <div className="flex min-h-[160px] flex-1 flex-col p-4 sm:p-5">
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <Newspaper className="size-4 shrink-0" aria-hidden="true" />{article.team ?? article.category}
                    </p>
                    <h3 className="text-xl leading-tight font-semibold xl:text-2xl">{article.title}</h3>
                    <p className="mt-4 text-sm text-white/60">{article.date}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-club-navy-light px-6 py-14 text-center sm:min-h-[380px]">
              <Newspaper className="mb-6 size-12 text-white/40" strokeWidth={1.25} aria-hidden="true" />
              <h3 className="text-2xl font-semibold text-white sm:text-3xl">
                {activeCategory === "Visi" ? "Jaunumi vēl nav publicēti" : "Šajā kategorijā vēl nav jaunumu"}
              </h3>
              <p className="mt-3 max-w-md text-base leading-relaxed text-white/60">
                {activeCategory === "Visi"
                  ? "Atgriezies vēlāk, lai uzzinātu jaunākos kluba notikumus."
                  : "Apskati citas kategorijas vai visus kluba jaunumus."}
              </p>
              {activeCategory !== "Visi" && (
                <button type="button" onClick={() => setActiveCategory("Visi")} className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 text-sm font-semibold text-white uppercase hover:bg-white/10 focus-visible:outline-white">
                  Skatīt visus jaunumus
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <section className="px-6 pb-12">
          <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Iepriekšējā lapa"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-white transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {getPageNumbers(currentPage, totalPages).map((pageNumber, index) =>
              pageNumber === "…" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-9 w-9 items-center justify-center text-sm text-slate-400"
                >
                  …
                </span>
              ) : (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  aria-current={pageNumber === currentPage ? "page" : undefined}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-sm font-semibold transition",
                    pageNumber === currentPage
                      ? "bg-white text-club-navy"
                      : "text-white/70 hover:bg-white/10",
                  )}
                >
                  {pageNumber}
                </button>
              ),
            )}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Nākamā lapa"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-white transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
