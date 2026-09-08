"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { ARTICLES, FEATURED_ARTICLES } from "@/lib/jaunumi-articles";

export function JaunumiDirectory() {
  const [featured, ...rest] = ARTICLES;

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
      <section className="px-6 pt-8 pb-8">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-6">
            {featured ? (
              <Link
                href={`/jaunumi/${featured.slug}`}
                className="group relative flex h-[360px] flex-col justify-end overflow-hidden rounded-[2rem] p-6 sm:p-8"
              >
                <Image
                  src={featured.image}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                <span className="relative z-10 text-xs font-medium text-white/70">
                  {featured.date}
                </span>
                <h2 className="relative z-10 mt-3 max-w-2xl text-2xl text-white sm:text-3xl">
                  {featured.title}
                </h2>
                <p className="relative z-10 mt-2 max-w-xl text-sm text-white/70">
                  {featured.excerpt}
                </p>

                <span className="absolute right-6 bottom-6 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/50 text-white transition group-hover:border-club-red group-hover:bg-club-red sm:right-8 sm:bottom-8">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ) : (
              <div className="rounded-[2rem] border border-slate-200 bg-white py-16 text-center text-slate-400">
                Raksti nav atrasti.
              </div>
            )}

            {rest.length > 0 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {rest.map((article) => (
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
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5 p-4">
                      <span className="text-xs font-medium text-slate-400">
                        {article.date}
                      </span>
                      <h3 className="line-clamp-2 text-base font-bold text-club-navy">
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

          {/* Sidebar */}
          <div className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl text-club-navy sm:text-3xl">Izceltie raksti</h2>
            <div className="mt-4 flex flex-col divide-y divide-slate-100">
              {FEATURED_ARTICLES.map((item) => (
                <Link
                  key={item.title}
                  href="/jaunumi"
                  className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-400">{item.date}</p>
                    <p className="line-clamp-2 text-sm text-club-navy">
                      {item.title}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-club-red" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pagination — decorative for now, only one page of real content exists */}
      <section className="px-6 pb-12">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-2">
          <button
            type="button"
            disabled
            aria-label="Iepriekšējā lapa"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {["1", "2", "3", "…", "10"].map((page, index) => (
            <span
              key={`${page}-${index}`}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
                page === "1" ? "bg-club-navy text-white" : "text-slate-400",
              )}
            >
              {page}
            </span>
          ))}
          <button
            type="button"
            disabled
            aria-label="Nākamā lapa"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </>
  );
}
