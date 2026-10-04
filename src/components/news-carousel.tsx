"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";

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
  featured = false,
  className,
}: {
  articles: NewsCarouselItem[];
  featured?: boolean;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [inView, setInView] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayEnabled = playing ?? !reducedMotion;
  const activeIndex = articles.length ? index % articles.length : 0;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    const updateVisibility = () => setVisible(!document.hidden);
    updatePreference();
    updateVisibility();
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    if (carouselRef.current) observer.observe(carouselRef.current);
    return () => {
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!featured || articles.length < 2 || !autoPlayEnabled || hovered || focused || !visible || !inView) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % articles.length), 7000);
    return () => window.clearTimeout(timer);
  }, [featured, articles.length, autoPlayEnabled, hovered, focused, visible, inView, index]);

  if (articles.length === 0) {
    if (!featured) return null;
    return (
      <div className={cn("flex h-full min-h-[520px] flex-col justify-end bg-club-navy p-6 sm:p-10", className)}>
        <h2 className="text-4xl font-bold tracking-tight text-white">Jaunumi</h2>
        <p className="mt-4 text-white/80">Jaunumi pašlaik nav pieejami.</p>
        <Link href="/jaunumi" className="mt-6 inline-flex min-h-11 items-center gap-3 self-start text-sm font-semibold text-white">
          Skatīt visus <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const article = articles[activeIndex];
  const Heading = featured ? "h2" : "h3";

  const go = (direction: "prev" | "next") => {
    setIndex((current) => {
      const next = direction === "next" ? current + 1 : current - 1;
      return (next + articles.length) % articles.length;
    });
  };

  return (
    <div
      ref={carouselRef}
      role="region"
      aria-roledescription="karuselis"
      aria-label="Jaunumu karuselis"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
      className={cn(
        "relative flex h-full min-h-[360px] flex-col overflow-hidden",
        featured ? "home-hero-news rounded-none" : "rounded-[1.5rem] shadow-sm",
        featured && articles.length > 1 && "hero-has-navigation",
        className,
      )}
    >
      <div
        className={cn(
          "hero-news-slide relative flex flex-1 flex-col justify-end p-6 pb-28 sm:p-8 sm:pb-28",
          featured && "p-6 pt-16 pb-28 sm:p-10 sm:pt-16 sm:pb-28 xl:p-12 xl:pt-16 xl:pb-28",
        )}
      >
        {articles.map((item, i) => (
          <Image
            key={item.slug}
            src={item.image}
            alt=""
            fill
            preload={i === 0}
            sizes={featured ? "100vw" : "(min-width: 1024px) 55vw, 100vw"}
            className={cn(
              "object-cover transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
              i === activeIndex ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
        {featured ? (
          <div className="hero-photo-shade absolute inset-0" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
        )}


        <div key={article.slug} className={cn("relative z-10 max-w-3xl", featured && "hero-news-content")}>
          {featured && <p className="hero-news-meta mb-3 flex items-center gap-3 text-xs font-medium text-white/85">{article.date} <span>Jaunumi</span></p>}
          <Heading className={cn("relative z-10 max-w-md text-3xl text-white sm:text-4xl", featured && "max-w-3xl text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl xl:text-[3.5rem]")}>
            <Link href={`/jaunumi/${article.slug}`}>{article.title}</Link>
          </Heading>
          <p className={cn("relative z-10 mt-3 line-clamp-2 max-w-md text-base text-white/70", featured && "max-w-xl text-base leading-relaxed text-white/85 sm:mt-5 sm:text-lg")}>
            {article.excerpt}
          </p>
          {featured && (
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Link href={`/jaunumi/${article.slug}`} className="motion-action hero-news-read inline-flex h-11 items-center border border-white px-4 text-xs font-semibold text-white uppercase hover:bg-white/10">
                Lasīt vairāk
              </Link>
            </div>
          )}
        </div>


      </div>

      {featured && articles.length > 1 && (
        <>
          <button type="button" onClick={() => go("prev")} aria-label="Iepriekšējais jaunums" className="absolute top-1/2 left-0 z-20 flex h-14 w-11 -translate-y-1/2 items-center justify-center bg-black/30 text-white transition-colors duration-200 hover:bg-black/60 focus-visible:outline-white motion-reduce:transition-none sm:h-16 sm:w-14">
            <ArrowLeft className="size-6" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => go("next")} aria-label="Nākamais jaunums" className="absolute top-1/2 right-0 z-20 flex h-14 w-11 -translate-y-1/2 items-center justify-center bg-black/30 text-white transition-colors duration-200 hover:bg-black/60 focus-visible:outline-white motion-reduce:transition-none sm:h-16 sm:w-14">
            <ArrowRight className="size-6" aria-hidden="true" />
          </button>
          <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-1 sm:bottom-4">
            <div className="flex items-center" aria-label="Izvēlēties jaunumu">
              {articles.map((item, i) => (
                <button key={item.slug} type="button" onClick={() => setIndex(i)} aria-label={`Jaunums ${i + 1}: ${item.title}`} aria-current={i === activeIndex ? "true" : undefined} className="flex size-11 items-center justify-center focus-visible:outline-white">
                  <span aria-hidden="true" className={cn("size-2.5 rounded-full border border-white", i === activeIndex ? "bg-white" : "bg-transparent")} />
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setPlaying(!autoPlayEnabled)} aria-label={autoPlayEnabled ? "Apturēt automātisko maiņu" : "Sākt automātisko maiņu"} className="flex size-11 items-center justify-center text-white/80 hover:text-white focus-visible:outline-white">
              {autoPlayEnabled ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </>
      )}

      {!featured && articles.length > 1 && (
        <div className={cn("absolute bottom-8 left-8 z-20 flex items-center gap-3 sm:left-10", featured && "hero-news-controls bottom-6 left-6 gap-3 sm:bottom-8 sm:left-10 xl:left-12")}>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => go("prev")}
              aria-label="Iepriekšējais raksts"
              className={cn("flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-transparent text-white transition-transform duration-150 ease-out active:scale-90", featured && "rounded-md border-white/40 hover:bg-white/10")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go("next")}
              aria-label="Nākamais raksts"
              className={cn("flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-transparent text-white transition-transform duration-150 ease-out active:scale-90", featured && "rounded-md border-white/40 hover:bg-white/10")}
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>


        </div>
      )}
    </div>
  );
}
