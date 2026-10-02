"use client";

import Image from "next/image";
import { UserRound, X } from "lucide-react";
import { useState } from "react";

import type { getTeamsRoster } from "@/components/home-teams-section";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
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

function Portrait({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  return <div className="relative aspect-square w-full overflow-hidden bg-white">
    {photoUrl ? <Image src={photoUrl} alt={name} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-contain object-bottom" /> : <div className="flex h-full items-center justify-center bg-[#f5f5f5]"><UserRound className="size-24 text-black/15" strokeWidth={1} /></div>}
  </div>;
}

export function TeamsDirectory({ teams }: { teams: Teams }) {
  const [teamId, setTeamId] = useState(teams[0]?.id);
  const [player, setPlayer] = useState<Player | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const team = teams.find((item) => item.id === teamId) ?? teams[0];
  const unassigned = team?.players.filter((item) => !POSITIONS.some((position) => position.key === item.position)) ?? [];
  const groups = [
    ...POSITIONS.map((position) => ({ ...position, players: team?.players.filter((item) => item.position === position.key) ?? [] })),
    ...(unassigned.length ? [{ key: "players", label: "Spēlētāji", players: unassigned }] : []),
  ];
  const person = player ?? coach;

  return <>
    <section className="teams-page-hero bg-black px-6 pt-8 text-white sm:px-10 sm:pt-12 lg:px-14">
      <div className="mx-auto max-w-[1920px]">
        <h1 className="mb-8 text-5xl leading-tight font-semibold uppercase sm:text-6xl lg:text-7xl">Komandas</h1>
        <nav aria-label="Komandas" className="flex gap-6 overflow-x-auto sm:gap-8">
          {teams.map((item) => <button key={item.id} type="button" aria-pressed={item.id === team?.id} onClick={() => setTeamId(item.id)} className={cn("shrink-0 border-b-4 pt-3 pb-2 text-base uppercase sm:text-lg", item.id === team?.id ? "border-white font-semibold" : "border-transparent")}>{item.name}</button>)}
        </nav>
      </div>
    </section>
    <section className="bg-white px-6 py-10 text-black sm:px-10 sm:py-12 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        {team ? <>
          <nav aria-label="Spēlētāju pozīcijas" className="mb-10 flex flex-wrap justify-center gap-3 sm:mb-12 sm:gap-5">
            {[...groups, { key: "staff", label: "Treneri", players: team.coaches }].map((group) => <button key={group.key} type="button" disabled={group.players.length === 0} onClick={() => document.getElementById(`roster-${group.key}`)?.scrollIntoView({ block: "start", behavior: "instant" })} className="min-h-12 border-2 border-black px-5 text-sm font-semibold uppercase hover:bg-black hover:text-white disabled:cursor-default disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-black sm:min-h-14 sm:px-7 sm:text-base">{group.label}</button>)}
          </nav>
          {team.players.length === 0 && <p className="mb-12 border-t border-black/10 py-8 text-black/50">Šai komandai vēl nav pievienoti spēlētāji.</p>}
          {groups.filter((group) => group.players.length > 0).map((group) => <section key={`${team.id}-${group.key}`} id={`roster-${group.key}`} className="mb-20 scroll-mt-28 sm:mb-28">
            <h2 className="mb-8 text-3xl font-semibold uppercase sm:text-4xl">{group.label}</h2>
            {group.players.length ? <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-8 lg:grid-cols-4 lg:gap-x-8">
              {group.players.map((item) => <button key={item.id} type="button" onClick={() => setPlayer(item)} className="min-w-0 text-left">
                <div className="relative"><Portrait name={item.name} photoUrl={item.photoUrl} />{item.number != null && <span className="absolute top-3 left-3 text-2xl font-semibold sm:text-3xl lg:text-4xl">{item.number}</span>}</div>
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
    <Drawer swipeDirection="right" open={Boolean(person)} onOpenChange={(open) => { if (!open) { setPlayer(null); setCoach(null); } }}>
      <DrawerContent className="!h-dvh !max-h-dvh !w-[min(100vw,480px)] border-none bg-white data-[swipe-direction=right]:rounded-none" overlayClassName="bg-black/50">
        <div className="flex items-center justify-between bg-black px-6 py-4 text-white"><DrawerTitle className="text-xl text-white">{person?.name}</DrawerTitle><DrawerClose aria-label="Aizvērt" className="flex size-11 items-center justify-center"><X className="size-6" /></DrawerClose></div>
        {person && <div className="min-h-0 flex-1 overflow-y-auto p-6 text-black"><Portrait name={person.name} photoUrl={person.photoUrl} /><dl className="mt-6 space-y-5 text-sm">
          {player && <><div><dt className="text-black/50">Dzimšanas datums</dt><dd className="mt-1">{player.birthdate}</dd></div><div><dt className="text-black/50">Pilsonība</dt><dd className="mt-1 flex items-center gap-2"><Image src={nationalityFlagImage(player.nationality)} alt="" width={80} height={48} className="h-5 w-7 rounded-sm object-cover" />{nationalityName(player.nationality)}</dd></div>{player.number != null && <div><dt className="text-black/50">Numurs</dt><dd className="mt-1">{player.number}</dd></div>}<div><dt className="text-black/50">Komandas un gūtie vārti</dt><dd className="mt-1">{player.teams.map((item) => <p key={item.name}>{item.name} — {item.goals}</p>)}</dd></div></>}
          {coach && <><div><dt className="text-black/50">Pozīcija</dt><dd className="mt-1">{coach.position}</dd></div><div><dt className="text-black/50">Licence</dt><dd className="mt-1">{coach.authority} {coach.license}</dd></div><div><dt className="text-black/50">Komandas</dt><dd className="mt-1">{coach.teamNames.join(", ")}</dd></div></>}
        </dl></div>}
      </DrawerContent>
    </Drawer>
  </>;
}
