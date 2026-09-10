"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Maximize2,
  Quote,
  Share2,
  X,
} from "lucide-react";

import { FacebookIcon } from "@/components/social-icons";
import { cn } from "@/lib/utils";
import type { Article } from "@/lib/jaunumi";

function ArticleImagesCarousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
      if (event.key === "ArrowLeft") go("prev");
      if (event.key === "ArrowRight") go("next");
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen]);

  if (images.length === 0) return null;

  const go = (direction: "prev" | "next") => {
    setIndex((current) => {
      const next = direction === "next" ? current + 1 : current - 1;
      return (next + images.length) % images.length;
    });
  };

  return (
    <>
      <div className="relative h-[280px] overflow-hidden rounded-[2rem] sm:h-[420px]">
        <Image key={images[index]} src={images[index]} alt="" fill className="object-cover" />

        <button
          type="button"
          onClick={() => setFullscreen(true)}
          aria-label="Skatīt pilnekrānā"
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {images.length > 1 && (
          <>
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />

            <div className="absolute bottom-4 left-8 z-20 flex items-center gap-3 sm:left-10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => go("prev")}
                  aria-label="Iepriekšējais attēls"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-transparent text-white transition hover:bg-white/10"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => go("next")}
                  aria-label="Nākamais attēls"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-transparent text-white transition hover:bg-white/10"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <span className="text-xl text-white">
                {String(index + 1).padStart(2, "0")}
                <span className="ml-1.5 text-sm font-medium text-white/50">
                  /{String(images.length).padStart(2, "0")}
                </span>
              </span>
              {images.length <= 5 && (
                <div className="flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Rādīt ${i + 1}. attēlu`}
                      className={cn(
                        "h-[3px] w-7 rounded-full transition-colors",
                        i === index ? "bg-club-red" : "bg-white/25",
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 sm:p-10"
          onClick={() => setFullscreen(false)}
        >
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            aria-label="Aizvērt"
            className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative h-full w-full">
            <Image
              key={images[index]}
              src={images[index]}
              alt=""
              fill
              className="object-contain"
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  go("prev");
                }}
                aria-label="Iepriekšējais attēls"
                className="absolute top-1/2 left-4 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white transition hover:bg-black/50 sm:left-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  go("next");
                }}
                aria-label="Nākamais attēls"
                className="absolute top-1/2 right-4 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white transition hover:bg-black/50 sm:right-8"
              >
                <ArrowRight className="h-4 w-4" />
              </button>

              <span className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 text-sm text-white/70 sm:bottom-8">
                {String(index + 1).padStart(2, "0")}
                <span className="ml-1 text-white/40">
                  /{String(images.length).padStart(2, "0")}
                </span>
              </span>
            </>
          )}
        </div>
      )}
    </>
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
      className="flex h-8 w-8 items-center justify-center text-club-navy transition hover:text-club-red"
    >
      <Share2 className="h-5 w-5" />
      {copied && (
        <span className="absolute mt-10 rounded-md bg-club-navy px-2 py-1 text-[10px] text-white">
          Nokopēts!
        </span>
      )}
    </button>
  );
}

export function ArticleDetail({ article }: { article: Article }) {
  const images = [article.image, ...(article.highlights ?? [])];

  return (
    <>
      {/* Header band */}
      <section className="pt-4 sm:px-6">
        <div className="mx-auto max-w-[1440px] rounded-b-[2rem] bg-gradient-to-br from-club-red/25 via-club-red/10 to-transparent px-6 py-8 sm:rounded-[2rem] sm:px-10 sm:py-10">
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

          {article.authorName && (
            <div className="mt-6 flex items-center justify-between gap-3.5">
              <div className="flex items-center gap-4">
                {article.authorAvatar ? (
                  <Image
                    src={article.authorAvatar}
                    alt={article.authorName}
                    width={72}
                    height={72}
                    className="h-18 w-18 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-18 w-18 shrink-0 items-center justify-center rounded-full bg-club-navy text-2xl font-bold text-white">
                    {article.authorName
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
                  </span>
                )}
                <span className="flex flex-col leading-tight">
                  <span className="text-lg font-semibold text-club-navy">
                    {article.authorName}
                  </span>
                  {article.authorPosition && (
                    <span className="text-base text-slate-500">
                      {article.authorPosition}
                    </span>
                  )}
                </span>
              </div>
              <div className="relative">
                <CopyLinkButton />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main content */}
      <section className="px-6 pt-8 pb-24">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="min-w-0">
            <ArticleImagesCarousel images={images} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-col gap-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              {article.body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {article.quote && (
              <div className="mt-6">
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
                  <button
                    type="button"
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      const text = encodeURIComponent(article.title);
                      window.open(
                        `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
                        "_blank",
                        "noopener,noreferrer,width=600,height=500",
                      );
                    }}
                    aria-label="Dalīties X"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-club-navy transition hover:text-club-red"
                  >
                    <XIcon className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      window.open(
                        `https://www.facebook.com/sharer/sharer.php?u=${url}`,
                        "_blank",
                        "noopener,noreferrer,width=600,height=500",
                      );
                    }}
                    aria-label="Dalīties Facebook"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-club-navy transition hover:text-club-red"
                  >
                    <FacebookIcon className="h-7 w-7" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
