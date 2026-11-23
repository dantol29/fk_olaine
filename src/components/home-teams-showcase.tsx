"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { getTeamsRoster } from "@/components/home-teams-section";
import { PlayerInfoModal } from "@/components/player-info-modal";
import { cn } from "@/lib/utils";

type Teams = Awaited<ReturnType<typeof getTeamsRoster>>;
type Player = Teams[number]["players"][number];

const arrowClass = "flex size-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

function snapPosition(slide: HTMLElement) {
  return Math.max(0, slide.offsetLeft - (parseFloat(getComputedStyle(slide).scrollMarginLeft) || 0));
}

export function HomeTeamsShowcase({ teams, className }: { teams: Teams; className?: string }) {
  const [profile, setProfile] = useState<Player | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const programmaticScroll = useRef(false);
  useEffect(() => () => { if (scrollTimer.current) clearTimeout(scrollTimer.current); }, []);
  const team = teams[0];
  if (!team) return null;
  const players = team.players;
  const activeIndex = Math.min(selectedIndex, Math.max(0, players.length - 1));
  const selected = players[activeIndex];

  function select(index: number) {
    const next = Math.max(0, Math.min(players.length - 1, index));
    setSelectedIndex(next);
    const rail = railRef.current;
    const slide = rail?.children.item(next) as HTMLElement | null;
    if (rail && slide) {
      programmaticScroll.current = true;
      rail.scrollTo({ left: snapPosition(slide), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => { programmaticScroll.current = false; }, 500);
    }
  }

  return <section className={cn("relative isolate bg-club-navy text-white", className)} aria-labelledby="home-players-heading">
    <div className="mb-4 flex min-h-10 items-start justify-between gap-4">
      <h2 id="home-players-heading" className="min-w-0 text-2xl leading-tight font-semibold break-words uppercase sm:text-3xl">Spēlētāji</h2>
      {players.length > 1 && (
        <div role="group" aria-label="Spēlētāju izvēle" className="flex shrink-0 items-center gap-2">
          <button type="button" aria-label="Iepriekšējais spēlētājs" onClick={() => select((activeIndex - 1 + players.length) % players.length)} className={arrowClass}>
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Nākamais spēlētājs" onClick={() => select((activeIndex + 1) % players.length)} className={arrowClass}>
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
    {selected ? <>
      <div className="relative overflow-hidden">
        <div ref={railRef} role="region" aria-label={`${team.name} spēlētāji`} tabIndex={0} className="no-scrollbar relative flex snap-x snap-mandatory overflow-x-auto pt-8 [--previous-peek:72px] after:w-[calc(100%-260px-var(--previous-peek))] after:shrink-0 after:content-[''] sm:pt-28 sm:[--previous-peek:120px] lg:[--previous-peek:200px] sm:after:w-[calc(100%-280px-var(--previous-peek))]" onScroll={(event) => {
          const rail = event.currentTarget;
          if (scrollTimer.current) clearTimeout(scrollTimer.current);
          scrollTimer.current = setTimeout(() => {
            if (programmaticScroll.current) { programmaticScroll.current = false; return; }
            const children = Array.from(rail.querySelectorAll<HTMLElement>("[data-player-slide]"));
            if (!children.length) return;
            const positions = children.map(snapPosition);
            const closest = positions.reduce((best, left, index) => Math.abs(left - rail.scrollLeft) < Math.abs(positions[best] - rail.scrollLeft) ? index : best, 0);
            setSelectedIndex(closest);
          }, 120);
        }}>
          {players.map((item, index) => <article key={item.id} data-player-slide className={cn("relative h-[420px] w-[260px] shrink-0 snap-start sm:h-[460px] sm:w-[280px]", index > 0 && "-ml-7 scroll-ml-[var(--previous-peek)] sm:-ml-10", index === activeIndex && "z-10")}>
            <div className={cn("relative h-full origin-bottom transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none", index === 0 && "origin-bottom-left", index === activeIndex ? "scale-[1.16] sm:scale-[1.23]" : "scale-[0.94]")}>
              <button type="button" aria-label={`Izvēlēties ${item.name}`} aria-pressed={index === activeIndex} onClick={() => select(index)} className="relative block h-full w-full focus-visible:outline-white">
                {item.photoUrl ? <Image src={item.photoUrl} alt="" fill sizes="(min-width: 640px) 280px, 260px" className={cn("object-contain object-bottom transition-[filter] duration-300 motion-reduce:transition-none", index !== activeIndex && "brightness-[0.55] sm:brightness-[0.82]")} /> : <span className="flex h-full items-center justify-center"><UserRound className="size-24 text-white/20" strokeWidth={1} aria-hidden="true" /></span>}
              </button>
              <div aria-hidden={index !== activeIndex} className={cn("absolute top-12 left-[86%] z-20 hidden items-start whitespace-nowrap transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none sm:flex", index === activeIndex ? "translate-x-0 opacity-100 delay-100 motion-reduce:delay-0" : "pointer-events-none translate-x-3 opacity-0")}>
                <span className="text-[142px] leading-[0.82] font-semibold tracking-[0.02em] tabular-nums">{item.number ?? 10}</span>
                <div className="ml-10 pt-2"><h3 className="text-3xl leading-none font-semibold uppercase">{item.name}</h3>{item.position && <p className="mt-2 text-base text-white/90">{item.position}</p>}<button type="button" tabIndex={index === activeIndex ? 0 : -1} onClick={() => setProfile(item)} className="mt-3 inline-flex min-h-10 items-center bg-white px-4 text-xs font-semibold text-club-navy uppercase hover:bg-white/80 focus-visible:outline-white">Profils</button></div>
              </div>
            </div>
          </article>)}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[30%] bg-gradient-to-t from-club-navy via-club-navy/65 to-transparent" />
      </div>
      <div className="relative z-10 -mt-28 sm:hidden">
        <div key={selected.id} className="home-player-info-enter flex min-h-24 items-end gap-5"><span className="text-[78px] leading-[0.85] font-semibold tracking-[0.02em] tabular-nums">{selected.number ?? 10}</span><div className="min-w-0 pb-1"><h3 className="text-[27px] leading-tight font-semibold uppercase">{selected.name}</h3>{selected.position && <p className="mt-1 text-base text-white/85">{selected.position}</p>}</div></div>
        <button type="button" onClick={() => setProfile(selected)} className="mt-5 grid min-h-12 w-full place-items-center border border-white text-sm font-semibold uppercase hover:bg-white hover:text-club-navy focus-visible:outline-white">Profils</button>
      </div>
    </> : <p className="py-12 text-sm text-white/60">Šīs komandas sastāvs drīzumā tiks papildināts.</p>}
    <PlayerInfoModal player={profile} onClose={() => setProfile(null)} />
  </section>;
}
