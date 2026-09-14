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

export function NewsCarousel({
  articles,
  className,
}: {
  articles: NewsCarouselItem[];
  className?: string;
}) {
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
    <div
      className={cn(
        "relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-[1.5rem] shadow-sm",
        className,
      )}
    >
      <Link
        href={`/jaunumi/${article.slug}`}
        className="relative flex flex-1 flex-col justify-end p-6 pb-20 sm:p-8 sm:pb-24"
      >
        {articles.map((item, i) => (
          <Image
            key={item.slug}
            src={item.image}
            alt=""
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 55vw, 100vw"
            className={cn(
              "object-cover transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
              i === index ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        <div key={article.slug} className="news-text-fade-in">
          <h3 className="relative z-10 max-w-md text-3xl text-white sm:text-4xl">
            {article.title}
          </h3>
          <p className="relative z-10 mt-3 line-clamp-2 max-w-md text-base text-white/70">
            {article.excerpt}
          </p>
        </div>

        <span className="absolute right-6 bottom-6 z-10 hidden h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-transparent text-white sm:right-8 sm:bottom-8 sm:flex">
          <ArrowRight className="h-5 w-5" />
        </span>
      </Link>

      {articles.length > 1 && (
        <div className="absolute bottom-8 left-8 z-20 flex items-center gap-3 sm:left-10">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => go("prev")}
              aria-label="Iepriekšējais raksts"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-transparent text-white transition-transform duration-150 ease-out active:scale-90"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go("next")}
              aria-label="Nākamais raksts"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-transparent text-white transition-transform duration-150 ease-out active:scale-90"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          <span className="text-2xl text-white sm:text-3xl">
            {String(index + 1).padStart(2, "0")}
            <span className="ml-1.5 text-base font-medium text-white/50">
              /{String(articles.length).padStart(2, "0")}
            </span>
          </span>
          <div className="flex gap-2">
            {articles.map((item, i) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Rādīt ${i + 1}. rakstu`}
                className={cn(
                  "h-1 w-9 rounded-full transition-[background-color,transform] duration-150 ease-out active:scale-90",
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
