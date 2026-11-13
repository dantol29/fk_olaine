"use client";

import Image from "next/image";
import { UserRound } from "lucide-react";
import { useState } from "react";

import type { getTeamsRoster } from "@/components/home-teams-section";
import { CoachInfoModal } from "@/components/coach-info-modal";
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
  return <span className="block min-w-0 flex-1 uppercase"><span className="block min-h-[1.25em] text-base leading-tight text-club-red sm:text-lg">{rest.length ? first : ""}</span><span className="block min-h-[2.5em] text-xl leading-tight font-semibold sm:text-2xl">{rest.length ? rest.join(" ") : first}</span></span>;
}

function Portrait({ name, photoUrl, cover = false }: { name: string; photoUrl: string | null; cover?: boolean }) {
  return <div className="relative aspect-square w-full overflow-hidden">
    {photoUrl ? <Image src={photoUrl} alt={name} fill sizes="(min-width: 1024px) 33vw, 50vw" className={cover ? "object-contain object-bottom" : "card-hover-image object-contain object-bottom"} /> : <div className="flex h-full items-center justify-center"><UserRound className="size-24 text-white/25" strokeWidth={1} /></div>}
  </div>;
}

export function TeamsDirectory({ teams }: { teams: Teams }) {
  const [teamId, setTeamId] = useState(teams[0]?.id);
  const [category, setCategory] = useState<string>("all");
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

  return <>
    <section className="teams-page-hero bg-black px-6 pt-6 text-white sm:px-10 sm:pt-8 lg:px-14">
      <div className="mx-auto max-w-[1920px]">
        <h1 className="mb-2 text-5xl leading-tight font-semibold uppercase sm:text-6xl lg:text-7xl">Komandas</h1>
        <nav aria-label="Komandas" className="flex items-end gap-6 overflow-x-auto sm:gap-8 lg:min-h-12">
          {teams.map((item) => <button key={item.id} type="button" aria-pressed={item.id === team?.id} onClick={() => { setTeamId(item.id); setCategory("all"); }} className={cn("relative shrink-0 pt-3 pb-2 text-base uppercase sm:text-lg", item.id === team?.id && "font-semibold after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-white")}>{item.name}</button>)}
        </nav>
      </div>
    </section>
    <section className="public-roster bg-club-navy px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        {team ? <>
          <nav aria-label="Spēlētāju pozīcijas" className="mb-10 flex flex-nowrap gap-3 overflow-x-auto [justify-content:safe_center] sm:mb-12 sm:gap-5">
            {[{ key: "all", label: "Visi", players: [...team.players, ...team.coaches] }, ...groups, { key: "staff", label: "Treneri", players: team.coaches }].map((group) => <button key={group.key} type="button" aria-pressed={category === group.key} disabled={group.key !== "all" && group.players.length === 0} onClick={() => setCategory(group.key)} className={cn("min-h-10 shrink-0 whitespace-nowrap border-2 border-black px-4 text-xs font-semibold uppercase hover:bg-black hover:text-white disabled:cursor-default disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-black sm:min-h-11 sm:px-5 sm:text-sm", category === group.key && "bg-black text-white")}>{group.label}</button>)}
          </nav>
          {category !== "staff" && team.players.length === 0 && <p className="mb-12 border-t border-black/10 py-8 text-black/50">Šai komandai vēl nav pievienoti spēlētāji.</p>}
          {groups.filter((group) => group.players.length > 0 && (category === "all" || category === group.key)).map((group) => <section key={`${team.id}-${group.key}`} id={`roster-${group.key}`} className="mb-20 scroll-mt-28 sm:mb-28">
            <h2 className="mb-8 text-3xl font-semibold uppercase sm:text-4xl">{group.label}</h2>
            {group.players.length ? <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-8 lg:grid-cols-4 lg:gap-x-8">
              {group.players.map((item) => <button key={item.id} type="button" onClick={() => setPlayer(item)} className="card-hover flex min-w-0 flex-col text-left focus-visible:outline-black">
                <div className="relative w-full shrink-0"><Portrait name={item.name} photoUrl={item.photoUrl} cover /><div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-3"><span className="text-2xl leading-none font-semibold text-white tabular-nums sm:text-3xl lg:text-4xl">{item.number ?? ""}</span><Image src={nationalityFlagImage(item.nationality)} alt={nationalityName(item.nationality)} title={nationalityName(item.nationality)} width={80} height={48} className="h-6 w-8 shrink-0 object-cover sm:h-7 sm:w-9" /></div></div>
                <div className="w-full pt-3 text-center"><Name name={item.name} /></div>
              </button>)}
            </div> : <p className="border-t border-black/10 py-6 text-sm text-black/50">Šajā pozīcijā vēl nav pievienoti spēlētāji.</p>}
          </section>)}
          {(category === "all" || category === "staff") && <section id="roster-staff" className="scroll-mt-28">
            <h2 className="mb-8 text-3xl font-semibold uppercase sm:text-4xl">Treneri</h2>
            {team.coaches.length ? <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-8 lg:grid-cols-3 lg:gap-x-10">{team.coaches.map((item) => <button key={item.id} type="button" onClick={() => setCoach(item)} className="min-w-0 text-left"><Portrait name={item.name} photoUrl={item.photoUrl} /><div className="pt-5"><Name name={item.name} /><span className="mt-2 block text-sm text-black/50">{item.position}</span></div></button>)}</div> : <p className="border-t border-black/10 py-6 text-sm text-black/50">Šai komandai vēl nav pievienoti treneri.</p>}
          </section>}
        </> : <p className="py-16 text-center text-black/50">Komandas vēl nav pievienotas.</p>}
      </div>
    </section>
    <PlayerInfoModal player={player} onClose={() => setPlayer(null)} />
    <CoachInfoModal coach={coach} onClose={() => setCoach(null)} />
  </>;
}
