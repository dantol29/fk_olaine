"use client";

import Image from "next/image";
import { UserRound, X } from "lucide-react";
import { useState } from "react";

import type { getTeamsRoster } from "@/components/home-teams-section";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { PlayerInfoModal } from "@/components/player-info-modal";
import { cn } from "@/lib/utils";
import { nationalityFlagImage, nationalityName } from "@/lib/nationality";

type Teams = Awaited<ReturnType<typeof getTeamsRoster>>;
type Player = Teams[number]["players"][number];
type Coach = Teams[number]["coaches"][number];
const POSITIONS = [
  { key: "goalkeeper", label: "Vārtsargi" },
  { key: "defender", label: "Aizsargi" },
  { key: "midfielder", label: "Pussargi" },
  { key: "forward", label: "Uzbrucēji" },
] as const;

function Name({ name }: { name: string }) {
  const [first, ...rest] = name.trim().split(/\s+/);
  return <span className="block uppercase"><span className="block text-base leading-tight text-club-red sm:text-lg">{rest.length ? first : ""}</span><span className="block text-xl leading-tight font-semibold sm:text-2xl">{rest.length ? rest.join(" ") : first}</span></span>;
}

function Portrait({ name, photoUrl, cover = false }: { name: string; photoUrl: string | null; cover?: boolean }) {
  return <div className="relative aspect-square w-full overflow-hidden bg-white">
    {photoUrl ? <Image src={photoUrl} alt={name} fill sizes="(min-width: 1024px) 33vw, 50vw" className={cn("card-hover-image", cover ? "object-cover object-top" : "object-contain object-bottom")} /> : <div className="flex h-full items-center justify-center bg-[#f5f5f5]"><UserRound className="size-24 text-black/15" strokeWidth={1} /></div>}
  </div>;
}

export function TeamsDirectory({ teams }: { teams: Teams }) {
  const [teamId, setTeamId] = useState(teams[0]?.id);
  const [player, setPlayer] = useState<Player | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const team = teams.find((item) => item.id === teamId) ?? teams[0];
  const groups = POSITIONS.map((position) => ({
    ...position,
    players: team?.players.filter((item) => {
      const assigned = POSITIONS.some((entry) => entry.key === item.position) ? item.position : "defender";
      return assigned === position.key;
    }) ?? [],
  }));
  const person = coach;

  return <>
    <section className="teams-page-hero bg-black px-6 pt-6 text-white sm:px-10 sm:pt-8 lg:px-14">
      <div className="mx-auto max-w-[1920px]">
        <h1 className="mb-2 text-5xl leading-tight font-semibold uppercase sm:text-6xl lg:text-7xl">Komandas</h1>
        <nav aria-label="Komandas" className="flex items-end gap-6 overflow-x-auto sm:gap-8 lg:min-h-12">
          {teams.map((item) => <button key={item.id} type="button" aria-pressed={item.id === team?.id} onClick={() => setTeamId(item.id)} className={cn("relative shrink-0 pt-3 pb-2 text-base uppercase sm:text-lg", item.id === team?.id && "font-semibold after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-white")}>{item.name}</button>)}
        </nav>
      </div>
    </section>
    <section className="bg-white px-6 py-10 text-black sm:px-10 sm:py-12 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        {team ? <>
          <nav aria-label="Spēlētāju pozīcijas" className="mb-10 flex flex-nowrap gap-3 overflow-x-auto [justify-content:safe_center] sm:mb-12 sm:gap-5">
            {[...groups, { key: "staff", label: "Treneri", players: team.coaches }].map((group) => <button key={group.key} type="button" disabled={group.players.length === 0} onClick={() => document.getElementById(`roster-${group.key}`)?.scrollIntoView({ block: "start", behavior: "instant" })} className="min-h-10 shrink-0 whitespace-nowrap border-2 border-black px-4 text-xs font-semibold uppercase hover:bg-black hover:text-white disabled:cursor-default disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-black sm:min-h-11 sm:px-5 sm:text-sm">{group.label}</button>)}
          </nav>
          {team.players.length === 0 && <p className="mb-12 border-t border-black/10 py-8 text-black/50">Šai komandai vēl nav pievienoti spēlētāji.</p>}
          {groups.filter((group) => group.players.length > 0).map((group) => <section key={`${team.id}-${group.key}`} id={`roster-${group.key}`} className="mb-20 scroll-mt-28 sm:mb-28">
            <h2 className="mb-8 text-3xl font-semibold uppercase sm:text-4xl">{group.label}</h2>
            {group.players.length ? <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-8 lg:grid-cols-4 lg:gap-x-8">
              {group.players.map((item) => <button key={item.id} type="button" onClick={() => setPlayer(item)} className="card-hover min-w-0 text-left focus-visible:outline-black">
                <div className="relative"><Portrait name={item.name} photoUrl={item.photoUrl} cover />{item.number != null && <span className="absolute top-3 left-3 text-2xl font-semibold sm:text-3xl lg:text-4xl">{item.number}</span>}</div>
                <div className="flex items-end justify-between gap-3 pt-3"><Name name={item.name} /><Image src={nationalityFlagImage(item.nationality)} alt={nationalityName(item.nationality)} title={nationalityName(item.nationality)} width={80} height={48} className="h-6 w-8 shrink-0 rounded-sm object-cover sm:h-7 sm:w-9" /></div>
              </button>)}
            </div> : <p className="border-t border-black/10 py-6 text-sm text-black/50">Šajā pozīcijā vēl nav pievienoti spēlētāji.</p>}
          </section>)}
          <section id="roster-staff" className="scroll-mt-28">
            <h2 className="mb-8 text-3xl font-semibold uppercase sm:text-4xl">Treneri</h2>
            {team.coaches.length ? <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-8 lg:grid-cols-3 lg:gap-x-10">{team.coaches.map((item) => <button key={item.id} type="button" onClick={() => setCoach(item)} className="min-w-0 text-left"><Portrait name={item.name} photoUrl={item.photoUrl} /><div className="pt-5"><Name name={item.name} /><span className="mt-2 block text-sm text-black/50">{item.position}</span></div></button>)}</div> : <p className="border-t border-black/10 py-6 text-sm text-black/50">Šai komandai vēl nav pievienoti treneri.</p>}
          </section>
        </> : <p className="py-16 text-center text-black/50">Komandas vēl nav pievienotas.</p>}
      </div>
    </section>
    <PlayerInfoModal player={player} onClose={() => setPlayer(null)} />
    <Drawer swipeDirection="right" open={Boolean(person)} onOpenChange={(open) => { if (!open) setCoach(null); }}>
      <DrawerContent className="!h-dvh !max-h-dvh !w-[min(100vw,400px)] border-none bg-white text-black shadow-xl data-[swipe-direction=right]:rounded-none motion-reduce:transition-none" overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-sm">
        <div className="flex shrink-0 items-center justify-between gap-4 bg-black px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-3 text-white"><DrawerTitle className="text-2xl font-normal text-white">{person?.name}</DrawerTitle><DrawerClose aria-label="Aizvērt" className="-mr-2 flex size-11 shrink-0 items-center justify-center hover:text-white/70 focus-visible:outline-white"><X className="size-6" /></DrawerClose></div>
        {person && <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-black"><div className="mx-auto max-w-[240px] overflow-hidden rounded-2xl"><Portrait name={person.name} photoUrl={person.photoUrl} /></div><dl className="mt-5 space-y-3 text-base [&>div]:rounded-2xl [&>div]:bg-[#f5f5f5] [&>div]:px-4 [&>div]:py-3 [&_dt]:text-xs [&_dt]:uppercase [&_dt]:text-black/50 [&_dd]:mt-1">
          {coach && <><div><dt>Pozīcija</dt><dd>{coach.position}</dd></div><div><dt>Licence</dt><dd>{coach.authority} {coach.license}</dd></div><div><dt>Komandas</dt><dd>{coach.teamNames.join(", ")}</dd></div></>}
        </dl></div>}
      </DrawerContent>
    </Drawer>
  </>;
}
