"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Link as LinkIcon,
  Mail,
  Maximize2,
  Share2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Article } from "@/lib/jaunumi";

export function ArticleImagesCarousel({ images, label = "Raksta galerija" }: { images: string[]; label?: string }) {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  function go(direction: "prev" | "next") {
    setIndex((current) => {
      const next = direction === "next" ? current + 1 : current - 1;
      return (next + images.length) % images.length;
    });
  }

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

  return (
    <>
      <section aria-label={label}>
        <div className="article-gallery-frame relative aspect-[4/3] w-full overflow-hidden bg-black sm:aspect-video">
          {images.map((image, imageIndex) => (
            <Image
              key={image}
              src={image}
              alt={`${label} — ${imageIndex + 1}. attēls`}
              fill
              sizes="(min-width: 1000px) 888px, (min-width: 640px) calc(100vw - 80px), calc(100vw - 48px)"
              className={cn(
                "object-contain transition-opacity duration-500 motion-reduce:transition-none",
                imageIndex === index ? "opacity-100" : "opacity-0",
              )}
            />
          ))}
          <button type="button" onClick={() => setFullscreen(true)} aria-label="Skatīt pilnekrānā" className="absolute top-4 right-4 z-20 flex size-11 items-center justify-center border border-white bg-black/40 text-white hover:bg-black/60 focus-visible:outline-white">
            <Maximize2 className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/15 py-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold uppercase">Galerija</span>
            <span aria-live="polite" aria-atomic="true" className="text-sm tabular-nums text-black/55">
              {String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
            </span>
          </div>
          {images.length > 1 && (
            <div className="flex items-center gap-2.5">
              <button type="button" onClick={() => go("prev")} aria-label="Iepriekšējais attēls" className="flex size-11 items-center justify-center border border-black text-black hover:bg-black/5 focus-visible:outline-black">
                <ArrowLeft className="size-5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => go("next")} aria-label="Nākamais attēls" className="flex size-11 items-center justify-center border border-black text-black hover:bg-black/5 focus-visible:outline-black">
                <ArrowRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </section>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 sm:p-10"
          onClick={() => setFullscreen(false)}
        >
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            aria-label="Aizvērt"
            className="absolute top-4 right-4 z-20 flex h-11 w-11 items-center justify-center border border-white bg-black/40 text-white transition hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative h-full w-full">
            {images.map((image, imageIndex) => (
              <Image
                key={image}
                src={image}
                alt=""
                fill
                sizes="100vw"
                className={cn(
                  "object-contain transition-opacity duration-500 motion-reduce:transition-none",
                  imageIndex === index ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
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
                className="absolute top-1/2 left-4 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white bg-black/30 text-white transition hover:bg-black/50 sm:left-8"
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
                className="absolute top-1/2 right-4 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white bg-black/30 text-white transition hover:bg-black/50 sm:right-8"
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

const shareButtonClass = "flex size-11 items-center justify-center rounded-full bg-black/35 text-white transition-colors hover:bg-black/60 focus-visible:outline-black";

function ArticleShare({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div className="relative flex flex-wrap items-center gap-3">
      <span className="mr-1 text-sm font-semibold">Dalīties</span>
      <button type="button" aria-label="Dalīties e-pastā" className={shareButtonClass} onClick={() => {
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(window.location.href)}`;
      }}><Mail className="size-5" aria-hidden="true" /></button>
      <button type="button" aria-label="Kopēt raksta saiti" className={shareButtonClass} onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setMessage("Neizdevās kopēt saiti. Kopējiet adresi no pārlūka adreses joslas.");
        }
      }}><LinkIcon className="size-5" aria-hidden="true" /></button>
      <button type="button" aria-label="Dalīties ar rakstu" className={shareButtonClass} onClick={async () => {
        if (navigator.share) {
          try { await navigator.share({ title, url: window.location.href }); }
          catch { /* Closing the share dialog requires no action. */ }
        } else {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer,width=600,height=500");
        }
      }}><Share2 className="size-5" aria-hidden="true" /></button>
      <span role="status" className="absolute top-full right-0 mt-2 text-xs">{copied ? "Nokopēts!" : message}</span>
    </div>
  );
}

export function ArticleDetail({ article }: { article: Article }) {
  return (
    <section aria-label="Raksta saturs" className="bg-white pb-20 text-[#262626] sm:pb-28">
      <div className="flex flex-wrap items-start justify-between gap-6 px-6 py-7 sm:px-10 lg:px-14">
        <div>
          <p className="text-lg font-semibold">Autors: {article.authorName ?? "FK Olaine"}</p>
          {article.authorPosition && <p className="mt-1 text-sm text-black/55">{article.authorPosition}</p>}
        </div>
        <ArticleShare title={article.title} />
      </div>

      <div className="mx-auto max-w-[1000px] px-6 pt-8 sm:px-10 sm:pt-12 lg:px-14">
        <div className="break-words text-base leading-[1.6] sm:text-lg lg:text-xl">
          {article.excerpt && <p className="mb-8 font-medium sm:mb-10">{article.excerpt}</p>}
          {article.body.map((paragraph, index) => (
            <p key={index} className="mb-8 whitespace-pre-wrap last:mb-0 sm:mb-10">{paragraph}</p>
          ))}

        </div>
        {article.highlights && article.highlights.length > 0 && (
          <div className="mt-12"><ArticleImagesCarousel images={article.highlights} /></div>
        )}
      </div>
    </section>
  );
}
