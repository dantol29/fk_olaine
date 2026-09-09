"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type NewsCarouselItem = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
};

export function NewsCarousel({ articles }: { articles: NewsCarouselItem[] }) {
  const [index, setIndex] = useState(0);

  if (articles.length === 0) return null;

  const article = articles[index];

  const go = (direction: "prev" | "next") => {
    setIndex((current) => {
      const next = direction === "next" ? current + 1 : current - 1;
      return (next + articles.length) % articles.length;
    });
  };

  return (
    <div className="relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 shadow-sm">
      <Link
        href={`/jaunumi/${article.slug}`}
        className="group relative flex flex-1 flex-col justify-end p-6 pb-20 sm:p-8 sm:pb-24"
      >
        <Image
          key={article.slug}
          src={article.image}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        <span className="relative z-10 text-xs font-medium text-white/70">
          {article.date}
        </span>
        <h3 className="relative z-10 mt-2 max-w-md text-xl text-white sm:text-2xl">
          {article.title}
        </h3>
        <p className="relative z-10 mt-2 line-clamp-2 max-w-md text-sm text-white/70">
          {article.excerpt}
        </p>

        <span className="absolute right-6 bottom-6 z-10 hidden h-11 w-11 items-center justify-center rounded-full border border-white/50 text-white transition group-hover:border-club-red group-hover:bg-club-red sm:right-8 sm:bottom-8 sm:flex">
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>

      {articles.length > 1 && (
        <div className="absolute bottom-8 left-8 z-20 flex items-center gap-3 sm:left-10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go("prev")}
              aria-label="Iepriekšējais raksts"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-transparent text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => go("next")}
              aria-label="Nākamais raksts"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-transparent text-white transition hover:bg-white/10"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="text-xl text-white">
            {String(index + 1).padStart(2, "0")}
            <span className="ml-1.5 text-sm font-medium text-white/50">
              /{String(articles.length).padStart(2, "0")}
            </span>
          </span>
          <div className="flex gap-1.5">
            {articles.map((item, i) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Rādīt ${i + 1}. rakstu`}
                className={cn(
                  "h-[3px] w-7 rounded-full transition-colors",
                  i === index ? "bg-club-red" : "bg-white/25",
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
