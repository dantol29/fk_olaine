"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronRight,
  Link2,
  Quote,
} from "lucide-react";

import { FacebookIcon } from "@/components/social-icons";
import { MatchCard } from "@/components/matches-showcase";
import { cn } from "@/lib/utils";
import type { UpcomingGame } from "@/lib/games";
import type { Article } from "@/lib/jaunumi";

function ArticleImagesCarousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  const go = (direction: "prev" | "next") => {
    setIndex((current) => {
      const next = direction === "next" ? current + 1 : current - 1;
      return (next + images.length) % images.length;
    });
  };

  return (
    <div className="relative h-[280px] overflow-hidden rounded-[2rem] sm:h-[420px]">
      <Image key={images[index]} src={images[index]} alt="" fill className="object-cover" />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go("prev")}
            aria-label="Iepriekšējais attēls"
            className="absolute top-1/2 left-3 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur transition hover:bg-black/50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => go("next")}
            aria-label="Nākamais attēls"
            className="absolute top-1/2 right-3 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur transition hover:bg-black/50"
          >
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Rādīt ${i + 1}. attēlu`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/40",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard API unavailable — no-op.
        }
      }}
      aria-label="Kopēt saiti"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-club-navy transition hover:bg-club-red hover:text-white"
    >
      <Link2 className="h-3.5 w-3.5" />
      {copied && (
        <span className="absolute mt-10 rounded-md bg-club-navy px-2 py-1 text-[10px] text-white">
          Nokopēts!
        </span>
      )}
    </button>
  );
}

type RelatedItem = {
  slug: string;
  title: string;
  date: string;
  image: string;
};

export function ArticleDetail({
  article,
  related,
  nextGame,
}: {
  article: Article;
  related: RelatedItem[];
  nextGame: UpcomingGame | null;
}) {
  const images = [article.image, ...(article.highlights ?? [])];

  return (
    <>
      {/* Header band */}
      <section className="pt-4 sm:px-6">
        <div className="mx-auto max-w-[1440px] bg-club-red/10 px-6 py-8 sm:rounded-[2rem] sm:px-10 sm:py-10">
          <nav className="mb-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Link href="/" className="hover:text-club-navy">
              Sākums
            </Link>
            <span>›</span>
            <Link href="/jaunumi" className="hover:text-club-navy">
              Jaunumi
            </Link>
            <span>›</span>
            <span className="max-w-[240px] truncate text-club-navy">
              {article.title}
            </span>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-club-red px-3 py-1 text-xs font-semibold text-white uppercase">
              {article.category}
            </span>
            {article.team && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-club-navy">
                {article.team}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Calendar className="h-3.5 w-3.5" />
              {article.date}
            </span>
          </div>

          <h1 className="mt-3 max-w-3xl text-3xl text-club-navy sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            {article.excerpt}
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="px-6 py-8">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 lg:grid-cols-[3fr_1fr]">
          <div className="min-w-0">
            <ArticleImagesCarousel images={images} />

            <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              {article.body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {article.quote && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <Quote className="h-6 w-6 text-club-red" />
                <p className="mt-3 text-lg leading-relaxed text-club-navy italic">
                  &ldquo;{article.quote.text}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-club-navy text-sm font-bold text-white">
                    {article.quote.author
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-club-navy">
                      {article.quote.author}
                    </p>
                    <p className="text-xs text-slate-400">
                      {article.quote.role}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {article.closing && (
              <p className="mt-6 text-sm leading-relaxed text-slate-600 sm:text-base">
                {article.closing}
              </p>
            )}
            {article.signature && (
              <p className="mt-4 font-bold text-club-navy">
                {article.signature}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
              <Link
                href="/jaunumi"
                className="flex items-center gap-2 text-sm text-club-navy transition hover:text-club-red"
              >
                <ArrowLeft className="h-4 w-4" />
                Atpakaļ uz jaunumiem
              </Link>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                Dalīties:
                <div className="relative flex items-center gap-2">
                  <a
                    href="#"
                    aria-label="Dalīties X"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-club-navy"
                  >
                    <XIcon className="h-6 w-6" />
                  </a>
                  <a
                    href="#"
                    aria-label="Dalīties Facebook"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-club-navy"
                  >
                    <FacebookIcon className="h-7 w-7" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {nextGame && (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3 px-3">
                  <h3 className="text-md text-club-navy">
                    Nākamā spēle
                  </h3>
                  <Link
                    href="/#kalendars"
                    className="flex items-center gap-1 text-sm text-club-red transition hover:text-club-red-dark"
                  >
                    Skatīt kalendāru
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="h-[300px]">
                  <MatchCard
                    game={nextGame}
                    isActive
                    elevated={false}
                    className="rounded-2xl bg-white shadow-sm"
                  />
                </div>
              </div>
            )}

            {related.length > 0 && (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <span className="text-sm text-club-red uppercase">
                  Saistītie raksti
                </span>
                <div className="mt-4 flex flex-col divide-y divide-slate-100">
                  {related.map((item) => (
                    <Link
                      key={item.slug}
                      href="/jaunumi"
                      className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-400">{item.date}</p>
                        <p className="line-clamp-2 text-sm font-semibold text-club-navy">
                          {item.title}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-club-red" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
