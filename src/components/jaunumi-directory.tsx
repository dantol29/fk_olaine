"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Article, ArticleCategory } from "@/lib/jaunumi";

const CATEGORIES: ArticleCategory[] = [
  "Klubs",
  "Komandas",
  "Spēles",
  "Treniņi",
  "Pasākumi",
];

// 1 featured + 2 side + 8 grid (two full lg:grid-cols-4 rows).
const PAGE_SIZE = 11;

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
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesCategory =
        activeCategory === "Visi" || article.category === activeCategory;
      const matchesQuery =
        q.length === 0 ||
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [articles, activeCategory, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Reset to page 1 whenever the filters change (adjusting state during
  // render, per https://react.dev/learn/you-might-not-need-an-effect,
  // instead of a setState-in-effect that would trigger a second render).
  const filterKey = `${activeCategory}|${query}`;
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

  const [featured, ...rest] = pageArticles;
  const sideArticles = rest.slice(0, 2);
  const gridArticles = rest.slice(2);

  return (
    <>
      {/* Hero */}
      <section className="px-6 pt-4">
        <div className="relative mx-auto h-[240px] max-w-[1440px] overflow-hidden rounded-[2rem] sm:h-[280px]">
          <Image
            src="/tactics-board-dusk.png"
            alt="FK Olaine jaunumi"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

          <div className="relative z-10 flex h-full w-full flex-col justify-center px-6 sm:px-10">
            <h1 className="text-5xl text-white sm:text-6xl">Jaunumi</h1>
            <p className="mt-4 text-sm text-white/70 sm:text-base">
              Notikumi. Cilvēki. Attīstība.
              <br />
              Viss par mūsu klubu.
            </p>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <section className="px-6 pt-6 pb-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(["Visi", ...CATEGORIES] as const).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm transition",
                    activeCategory === category
                      ? "bg-club-navy text-white"
                      : "bg-slate-100 text-club-navy hover:bg-slate-200",
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
            <label className="relative flex w-full max-w-xs shrink-0 items-center">
              <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-black" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Meklēt rakstus..."
                className="w-full rounded-full border border-slate-200 bg-white py-2 pr-4 pl-10 text-sm text-club-navy outline-none focus:border-club-red"
              />
            </label>
          </div>

          <div className="flex flex-col gap-6">
            {featured ? (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
                <Link
                  href={`/jaunumi/${featured.slug}`}
                  className="group relative flex h-[280px] flex-col justify-end overflow-hidden rounded-[2rem] p-6 sm:h-[360px] sm:p-8"
                >
                  <Image
                    src={featured.image}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                  <span className="absolute top-5 left-5 z-10 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-xs tracking-wide text-white uppercase">
                    {featured.category}
                  </span>

                  <span className="relative z-10 text-xs font-medium text-white/70">
                    {featured.date}
                  </span>
                  <h2 className="relative z-10 mt-3 max-w-2xl pr-14 text-2xl text-white sm:text-3xl lg:pr-0">
                    {featured.title}
                  </h2>
                  <p className="relative z-10 mt-2 max-w-xl pr-14 text-sm text-white/70 lg:pr-0">
                    {featured.excerpt}
                  </p>

                  <span className="absolute right-6 bottom-6 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/50 text-white transition group-hover:border-club-red group-hover:bg-club-red sm:right-8 sm:bottom-8">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>

                {sideArticles.length > 0 && (
                  <div className="flex flex-col gap-4 sm:h-[360px] sm:gap-5">
                    {sideArticles.map((article) => (
                      <Link
                        key={article.slug}
                        href={`/jaunumi/${article.slug}`}
                        className="group relative flex h-36 flex-col justify-end overflow-hidden rounded-2xl p-4 sm:h-auto sm:flex-1"
                      >
                        <Image
                          src={article.image}
                          alt=""
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                        <span className="absolute top-3 left-3 z-10 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-xs tracking-wide text-white uppercase">
                          {article.category}
                        </span>

                        <span className="relative z-10 text-xs font-medium text-white/70">
                          {article.date}
                        </span>
                        <h3 className="relative z-10 mt-1 max-w-[calc(100%-2.5rem)] line-clamp-2 text-sm font-semibold text-white">
                          {article.title}
                        </h3>

                        <span className="absolute right-3 bottom-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/50 text-white transition group-hover:border-club-red group-hover:bg-club-red">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-slate-200 bg-white py-16 text-center text-slate-400">
                Raksti nav atrasti.
              </div>
            )}

            {gridArticles.length > 0 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {gridArticles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/jaunumi/${article.slug}`}
                    className="group flex flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={article.image}
                        alt=""
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-3 left-3 z-10 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-xs tracking-wide text-white uppercase">
                        {article.category}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5 p-4">
                      <span className="text-xs font-medium text-slate-400">
                        {article.date}
                      </span>
                      <h3 className="line-clamp-2 text-base font-semibold text-club-navy">
                        {article.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-slate-500">
                        {article.excerpt}
                      </p>
                      <span className="mt-auto flex justify-end pt-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-club-navy transition group-hover:bg-club-red group-hover:text-white">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
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
              className="flex h-9 w-9 items-center justify-center rounded-full text-club-navy transition hover:bg-slate-100 disabled:pointer-events-none disabled:text-slate-300"
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
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition",
                    pageNumber === currentPage
                      ? "bg-club-navy text-white"
                      : "text-slate-400 hover:bg-slate-100",
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
              className="flex h-9 w-9 items-center justify-center rounded-full text-club-navy transition hover:bg-slate-100 disabled:pointer-events-none disabled:text-slate-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}
    </>
  );
}
