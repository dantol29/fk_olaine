"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

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

// Varying the image aspect ratio card-to-card (rather than one fixed
// height) is what actually produces the masonry/waterfall look in a CSS
// `columns` layout — a uniform ratio would just make evenly-tall cards
// wrap into columns, no visual rhythm. Kept short/wide so photos stay
// small relative to the card.
const ARTICLE_ASPECTS = ["aspect-video", "aspect-[2/1]", "aspect-[16/10]"];

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
    <>
      {/* Title */}
      <section className="px-6 pt-14 sm:pt-14">
        <div className="mx-auto max-w-[1440px]">
          <div className="relative flex min-h-24 flex-col justify-center sm:min-h-32">
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:text-8xl"
            >
              Jaunumi
            </span>
            <h1 className="relative text-4xl tracking-[-0.02em] text-club-navy sm:text-5xl">
              Jaunumi
            </h1>
          </div>
        </div>
      </section>

      {/* Main list */}
      <section className="px-6 pt-6 pb-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6 flex flex-wrap gap-2">
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

          {pageArticles.length > 0 ? (
            <div className="columns-1 gap-4 sm:columns-2 sm:gap-5 lg:columns-3">
              {pageArticles.map((article, index) => (
                <Link
                  key={article.slug}
                  href={`/jaunumi/${article.slug}`}
                  className="group mb-4 flex break-inside-avoid flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm sm:mb-5"
                >
                  <div
                    className={cn(
                      "relative w-full shrink-0 overflow-hidden",
                      ARTICLE_ASPECTS[index % ARTICLE_ASPECTS.length],
                    )}
                  >
                    <Image
                      src={article.image}
                      alt=""
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="relative z-10 -mt-4 flex flex-1 flex-col gap-2 rounded-t-2xl bg-white p-6">
                    <span className="text-xs font-medium text-slate-400">
                      {article.date}
                    </span>
                    <h3 className="text-xl text-club-navy">
                      {article.title}
                    </h3>
                    <p className="line-clamp-3 text-sm text-slate-500">
                      {article.excerpt}
                    </p>
                    <span className="mt-2 inline-flex w-fit items-center gap-2 text-sm font-semibold text-club-navy transition group-hover:text-club-red">
                      Lasīt vairāk
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 transition group-hover:border-club-red group-hover:bg-club-red group-hover:text-white">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-slate-200 bg-white py-16 text-center text-slate-400">
              Raksti nav atrasti.
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
