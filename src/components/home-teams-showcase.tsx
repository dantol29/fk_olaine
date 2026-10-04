"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { getTeamsRoster } from "@/components/home-teams-section";
import { PlayerInfoModal } from "@/components/player-info-modal";
import { nationalityFlagImage, nationalityName } from "@/lib/nationality";

type Teams = Awaited<ReturnType<typeof getTeamsRoster>>;
type Player = Teams[number]["players"][number];

function PlayerPortrait({ player }: { player: Player }) {
  return <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-[#f5f5f5]">
    {player.photoUrl ? <Image src={player.photoUrl} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-contain object-bottom" /> : <div className="flex h-full items-center justify-center"><UserRound className="size-20 text-black/15" strokeWidth={1} /></div>}
    <div className="absolute top-4 right-4 left-4 flex items-center justify-between gap-3">
      <span className="text-3xl leading-none font-semibold tabular-nums sm:text-4xl">{player.number ?? ""}</span>
      <Image src={nationalityFlagImage(player.nationality)} alt={nationalityName(player.nationality)} title={nationalityName(player.nationality)} width={80} height={48} className="h-5 w-7 shrink-0 object-cover sm:h-6 sm:w-8" />
    </div>
  </div>;
}

export function HomeTeamsShowcase({ teams, className }: { teams: Teams; className?: string }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ previous: false, next: false });
  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    const update = () => setCanScroll({ previous: gallery.scrollLeft > 2, next: gallery.scrollLeft < gallery.scrollWidth - gallery.clientWidth - 2 });
    const observer = new ResizeObserver(update);
    observer.observe(gallery);
    gallery.addEventListener("scroll", update, { passive: true });
    update();
    return () => { observer.disconnect(); gallery.removeEventListener("scroll", update); };
  }, [teams[0]?.id, teams[0]?.players.length]);
  const team = teams[0];
  if (!team) return null;
  const players = team.players;
  function scrollGallery(direction: number) {
    const gallery = galleryRef.current;
    if (!gallery) return;
    gallery.scrollBy({ left: direction * gallery.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  return <div className={className}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-baseline gap-3"><h3 className="text-xl font-semibold uppercase sm:text-2xl">{team.name}</h3><p className="text-sm text-black/45">{team.players.length} spēlētāji</p></div>
    </div>
    {players.length ? <div className="relative mt-5"><div ref={galleryRef} role="region" aria-label={`${team.name} spēlētāji`} tabIndex={0} className="no-scrollbar grid snap-x snap-mandatory auto-cols-[72%] grid-flow-col gap-6 overflow-x-auto pb-4 sm:auto-cols-[calc((100%_-_48px)/3)] lg:auto-cols-[calc((100%_-_72px)/4)]">
      {players.map((item) => {
        const [first, ...rest] = item.name.trim().split(/\s+/);
        return <button key={item.id} type="button" onClick={() => setPlayer(item)} className="card-hover flex min-w-0 snap-start flex-col text-left focus-visible:outline-black">
          <PlayerPortrait player={item} />
          <div className="mt-4 w-full text-center">
            <div className="min-w-0 uppercase"><span className="block min-h-[1.25em] text-sm leading-tight text-club-red sm:text-base">{rest.length ? first : ""}</span><span className="block min-h-[2.5em] text-lg leading-tight font-semibold sm:text-2xl">{rest.length ? rest.join(" ") : first}</span></div>
          </div>
        </button>;
      })}
    </div>
      {(canScroll.previous || canScroll.next) && <>
        <button type="button" aria-label="Iepriekšējie spēlētāji" disabled={!canScroll.previous} onClick={() => scrollGallery(-1)} className="absolute top-1/2 left-0 z-10 flex h-14 w-11 -translate-y-1/2 items-center justify-center bg-black/30 text-white transition-colors duration-200 hover:bg-black/60 focus-visible:outline-black disabled:opacity-35 disabled:hover:bg-black/30 motion-reduce:transition-none sm:h-16 sm:w-14"><ArrowLeft className="size-6" aria-hidden="true" /></button>
        <button type="button" aria-label="Nākamie spēlētāji" disabled={!canScroll.next} onClick={() => scrollGallery(1)} className="absolute top-1/2 right-0 z-10 flex h-14 w-11 -translate-y-1/2 items-center justify-center bg-black/30 text-white transition-colors duration-200 hover:bg-black/60 focus-visible:outline-black disabled:opacity-35 disabled:hover:bg-black/30 motion-reduce:transition-none sm:h-16 sm:w-14"><ArrowRight className="size-6" aria-hidden="true" /></button>
      </>}
    </div> : <p className="py-12 text-sm text-black/50">Šīs komandas sastāvs drīzumā tiks papildināts.</p>}
    <PlayerInfoModal player={player} onClose={() => setPlayer(null)} />
  </div>;
}
