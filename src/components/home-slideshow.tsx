"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function HomeSlideshow({ slides }: { slides: string[] }) {
  const images = slides.length ? slides : ["/stadions.jpg"];
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = index % images.length;
  const autoPlay = playing ?? !reducedMotion;

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setVisible(!document.hidden);
    updateMotion(); updateVisibility();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    if (ref.current) observer.observe(ref.current);
    return () => { media.removeEventListener("change", updateMotion); document.removeEventListener("visibilitychange", updateVisibility); observer.disconnect(); };
  }, []);
  useEffect(() => {
    if (images.length < 2 || !autoPlay || paused || !visible || !inView) return;
    const timer = setTimeout(() => setIndex((current) => (current + 1) % images.length), 7000);
    return () => clearTimeout(timer);
  }, [images.length, autoPlay, paused, visible, inView, index]);

  return <div ref={ref} role="region" aria-roledescription="karuselis" aria-label="Kluba attēli" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }} className="relative min-h-0 flex-1 overflow-hidden bg-club-navy">
    {images.map((src, i) => <Image key={src} src={src} alt={i === active ? `FK Olaine — attēls ${i + 1} no ${images.length}` : ""} fill preload={i === 0} sizes="100vw" className={cn("object-cover transition-opacity duration-700 motion-reduce:transition-none", i === active ? "opacity-100" : "opacity-0")} />)}
    <div className="hero-photo-shade pointer-events-none absolute inset-0" />
    {images.length > 1 && <>
      <button type="button" onClick={() => setIndex((current) => (current + images.length - 1) % images.length)} aria-label="Iepriekšējais attēls" className="absolute top-1/2 left-0 flex h-14 w-11 -translate-y-1/2 items-center justify-center bg-black/30 text-white hover:bg-black/60 focus-visible:outline-white"><ArrowLeft aria-hidden="true" /></button>
      <button type="button" onClick={() => setIndex((current) => (current + 1) % images.length)} aria-label="Nākamais attēls" className="absolute top-1/2 right-0 flex h-14 w-11 -translate-y-1/2 items-center justify-center bg-black/30 text-white hover:bg-black/60 focus-visible:outline-white"><ArrowRight aria-hidden="true" /></button>
      <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1 px-12">
        <div className="flex max-w-full items-center overflow-x-auto" aria-label="Izvēlēties attēlu">
          {images.map((src, i) => <button key={src} type="button" onClick={() => setIndex(i)} aria-label={`Attēls ${i + 1} no ${images.length}`} aria-current={i === active ? "true" : undefined} className="flex size-11 shrink-0 items-center justify-center focus-visible:outline-white"><span aria-hidden="true" className={cn("size-2.5 rounded-full border border-white shadow", i === active && "bg-white")} /></button>)}
        </div>
        <button type="button" onClick={() => setPlaying(!autoPlay)} aria-label={autoPlay ? "Apturēt automātisko maiņu" : "Sākt automātisko maiņu"} className="flex size-11 items-center justify-center bg-black/40 text-white focus-visible:outline-white">{autoPlay ? <Pause className="size-4" /> : <Play className="size-4" />}</button>
      </div>
    </>}
  </div>;
}
