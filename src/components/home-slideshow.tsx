"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
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
      <div className="absolute right-4 bottom-3 flex items-center">
        <button type="button" onClick={() => setPlaying(!autoPlay)} aria-label={autoPlay ? "Apturēt automātisko maiņu" : "Sākt automātisko maiņu"} className="flex size-11 items-center justify-center bg-black/40 text-white focus-visible:outline-white">{autoPlay ? <Pause className="size-4" /> : <Play className="size-4" />}</button>
      </div>
    </>}
  </div>;
}
