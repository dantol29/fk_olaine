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
import type { UpcomingGame } from "@/lib/games";
import type { Article } from "@/lib/jaunumi-articles";

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
  return (
    <>
      {/* Header band */}
      <section className="px-6 pt-4">
        <div className="relative mx-auto h-[320px] max-w-[1440px] overflow-hidden rounded-[2rem] sm:h-[360px]">
          <Image src={article.image} alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/10" />

          <div className="relative z-10 flex h-full w-full flex-col justify-end px-6 pb-8 sm:px-10">
            <nav className="mb-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link href="/" className="hover:text-club-red">
                Sākums
              </Link>
              <span>›</span>
              <Link href="/jaunumi" className="hover:text-club-red">
                Jaunumi
              </Link>
              <span>›</span>
              <span className="max-w-[240px] truncate text-club-navy">
                {article.title}
              </span>
            </nav>

            <h1 className="max-w-3xl text-3xl font-extrabold text-club-navy sm:text-4xl">
              {article.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-500 sm:text-base">
              {article.excerpt}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                {article.date}
              </span>
              {article.team && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-club-navy">
                  {article.team}
                </span>
              )}
            </div>
          </div>

          <div className="absolute top-6 right-6 z-10 hidden text-right text-xs leading-tight tracking-[0.2em] text-club-navy uppercase sm:block">
            <p>Attīstība</p>
            <p>Komanda</p>
            <p>Raksturs</p>
            <p>Izaugsme</p>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="px-6 py-8">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="min-w-0">
            <div className="relative h-[280px] overflow-hidden rounded-[2rem] sm:h-[420px]">
              <Image src={article.image} alt="" fill className="object-cover" />
            </div>

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
                    <p className="text-xs text-slate-400">{article.quote.role}</p>
                  </div>
                </div>
              </div>
            )}

            {article.highlights && article.highlights.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-club-navy">
                  Spilgtākie momenti
                </h2>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {article.highlights.map((src, index) => (
                    <div
                      key={index}
                      className="relative aspect-square overflow-hidden rounded-2xl"
                    >
                      <Image src={src} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {article.closing && (
              <p className="mt-6 text-sm leading-relaxed text-slate-600 sm:text-base">
                {article.closing}
              </p>
            )}
            {article.signature && (
              <p className="mt-4 font-bold text-club-navy">{article.signature}</p>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
              <Link
                href="/jaunumi"
                className="flex items-center gap-2 text-sm font-semibold text-club-navy transition hover:text-club-red"
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
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-club-navy transition hover:bg-club-red hover:text-white"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href="#"
                    aria-label="Dalīties Facebook"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-club-navy transition hover:bg-club-red hover:text-white"
                  >
                    <FacebookIcon className="h-3.5 w-3.5" />
                  </a>
                  <CopyLinkButton />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {nextGame && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-club-navy">
                  Nākamā spēle
                </h3>
                <div className="mt-3">
                  <MatchCard game={nextGame} isActive />
                </div>
                <Link
                  href="/#kalendars"
                  className="mt-4 flex items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-club-navy transition hover:bg-slate-200"
                >
                  Skatīt kalendāru
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {related.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="text-xs font-bold tracking-[0.15em] text-club-red uppercase">
                  Saistītie raksti
                </span>
                <div className="mt-4 flex flex-col divide-y divide-slate-100">
                  {related.map((item) => (
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

            <div className="relative overflow-hidden rounded-2xl bg-club-navy p-6">
              <Image
                src="/stadium-corner-flag.png"
                alt=""
                fill
                className="object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-club-navy/70" />
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-white">
                  Pievienojies FK Olaine
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  Vairāk nekā futbols. Tava izaugsme sākas šeit.
                </p>
                <Link
                  href="/klubs"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-club-navy transition hover:bg-slate-100"
                >
                  Uzzināt vairāk
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
