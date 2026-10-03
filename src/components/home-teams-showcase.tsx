"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, UserRound, X } from "lucide-react";
import { useRef, useState } from "react";
import type { getTeamsRoster } from "@/components/home-teams-section";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { nationalityFlagImage, nationalityName } from "@/lib/nationality";

type Teams = Awaited<ReturnType<typeof getTeamsRoster>>;
type Player = Teams[number]["players"][number];
const POSITIONS: Record<string, string> = { goalkeeper: "Vārtsargs", defender: "Aizsargs", midfielder: "Pussargs", forward: "Uzbrucējs" };

function PlayerPortrait({ player, detail = false }: { player: Player; detail?: boolean }) {
  return <div className="relative aspect-square overflow-hidden bg-[#f5f5f5]">
    {player.photoUrl ? <Image src={player.photoUrl} alt="" fill sizes={detail ? "240px" : "(min-width: 1024px) 25vw, 50vw"} className="object-contain object-bottom" /> : <div className="flex h-full items-center justify-center"><UserRound className="size-20 text-black/15" strokeWidth={1} /></div>}
    {player.number != null && !detail && <span className="absolute top-4 left-4 text-3xl leading-none font-semibold tabular-nums sm:text-4xl">{player.number}</span>}
  </div>;
}

export function HomeTeamsShowcase({ teams, className }: { teams: Teams; className?: string }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
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
      {players.length > 1 && <div className="flex gap-2"><button type="button" aria-label="Iepriekšējie spēlētāji" onClick={() => scrollGallery(-1)} className="flex size-11 items-center justify-center border-2 border-black hover:bg-black hover:text-white"><ChevronLeft className="size-5" /></button><button type="button" aria-label="Nākamie spēlētāji" onClick={() => scrollGallery(1)} className="flex size-11 items-center justify-center border-2 border-black hover:bg-black hover:text-white"><ChevronRight className="size-5" /></button></div>}
    </div>
    {players.length ? <div ref={galleryRef} role="region" aria-label={`${team.name} spēlētāji`} tabIndex={0} className="mt-5 grid snap-x snap-mandatory auto-cols-[72%] grid-flow-col gap-6 overflow-x-auto pb-4 sm:auto-cols-[calc((100%_-_48px)/3)] lg:auto-cols-[calc((100%_-_72px)/4)]">
      {players.map((item) => {
        const [first, ...rest] = item.name.trim().split(/\s+/);
        return <button key={item.id} type="button" onClick={() => setPlayer(item)} className="min-w-0 snap-start text-left focus-visible:outline-black">
          <PlayerPortrait player={item} />
          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="min-w-0 uppercase"><span className="block text-sm leading-tight text-club-red sm:text-base">{rest.length ? first : ""}</span><span className="block text-lg leading-tight font-semibold sm:text-2xl">{rest.length ? rest.join(" ") : first}</span></div>
            <Image src={nationalityFlagImage(item.nationality)} alt={nationalityName(item.nationality)} width={80} height={48} className="h-5 w-7 shrink-0 rounded-sm object-cover sm:h-6 sm:w-8" />
          </div>
          <p className="mt-2 text-xs text-black/45 sm:text-sm">{POSITIONS[item.position ?? "defender"] ?? "Aizsargs"}</p>
        </button>;
      })}
    </div> : <p className="py-12 text-sm text-black/50">Šīs komandas sastāvs drīzumā tiks papildināts.</p>}
    <Drawer swipeDirection="right" open={Boolean(player)} onOpenChange={(open) => { if (!open) setPlayer(null); }}>
      <DrawerContent className="!h-dvh !max-h-dvh !w-[min(100vw,400px)] border-none bg-white text-black shadow-xl data-[swipe-direction=right]:rounded-none motion-reduce:transition-none" overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-sm">
        <div className="flex shrink-0 items-center justify-between gap-4 bg-black px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-3 text-white"><DrawerTitle className="text-2xl font-normal text-white">{player?.name}</DrawerTitle><DrawerClose aria-label="Aizvērt" className="-mr-2 flex size-11 shrink-0 items-center justify-center focus-visible:outline-white"><X className="size-6" /></DrawerClose></div>
        {player && <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-[240px] overflow-hidden rounded-2xl"><PlayerPortrait player={player} detail /></div>
          <dl className="mt-5 space-y-3 text-base [&>div]:rounded-2xl [&>div]:bg-[#f5f5f5] [&>div]:px-4 [&>div]:py-3 [&_dt]:text-xs [&_dt]:uppercase [&_dt]:text-black/50 [&_dd]:mt-1">
            <div><dt>Pozīcija</dt><dd>{POSITIONS[player.position ?? "defender"] ?? "Aizsargs"}</dd></div>
            <div><dt>Dzimšanas datums</dt><dd>{player.birthdate}</dd></div>
            <div><dt>Pilsonība</dt><dd className="flex items-center gap-2"><Image src={nationalityFlagImage(player.nationality)} alt="" width={80} height={48} className="h-5 w-7 rounded-sm object-cover" />{nationalityName(player.nationality)}</dd></div>
            {player.number != null && <div><dt>Numurs</dt><dd>{player.number}</dd></div>}
            <div><dt>Komandas un gūtie vārti</dt><dd>{player.teams.map((item) => <p key={item.name}>{item.name} — {item.goals}</p>)}</dd></div>
          </dl>
        </div>}
      </DrawerContent>
    </Drawer>
  </div>;
}
