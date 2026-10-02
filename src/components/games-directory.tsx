"use client";

import Image from "next/image";
import { CalendarDays, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { GameListItem } from "@/lib/games-server";
import type { LeagueStandings } from "@/lib/league-standings-server";
import { UpcomingMatches, MatchListCard, matchKickoff } from "@/components/upcoming-matches";
import { GamesMonthCalendar } from "@/components/games-month-calendar";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

type View = "fixtures" | "results" | "table";
const VIEWS: { id: View; label: string }[] = [
  { id: "fixtures", label: "Gaidāmās" },
  { id: "results", label: "Aizvadītās" },
  { id: "table", label: "Tabula" },
];

export function GamesDirectory({ games, leagues }: { games: GameListItem[]; leagues: LeagueStandings[] }) {
  const [selectedTeam, setActiveTeam] = useState("");
  const [view, setView] = useState<View>("table");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<string | null>(null);
  const year = String(new Date().getFullYear());
  const [leagueLabel, setLeagueLabel] = useState("");
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const teamNames = [...new Set([...games.map((game) => game.teamName), ...leagues.flatMap((league) => league.teamName ? [league.teamName] : [])])];
  const activeTeam = teamNames.includes(selectedTeam) ? selectedTeam : teamNames[0] ?? "";
  const teamGames = games.filter((game) => game.teamName === activeTeam && game.year === year);
  const upcoming = teamGames.filter((game) => !game.isPast && matchKickoff(game) > Date.now());
  const displayedGames = view === "results" ? teamGames.filter((game) => matchKickoff(game) <= Date.now()).reverse() : upcoming;
  const teamLeagues = leagues.filter((league) => league.teamName === activeTeam);
  const league = teamLeagues.find((item) => item.label === leagueLabel) ?? teamLeagues[0];
  const leagueLogo = league?.logoUrl && league.logoUrl !== failedLogo ? league.logoUrl : null;

  return (
    <Drawer swipeDirection="right" open={calendarOpen} onOpenChange={setCalendarOpen}>
      <section className="games-page-hero bg-black px-6 pt-6 text-white sm:px-10 sm:pt-8 lg:px-14">
        <div className="mx-auto max-w-[1920px]">
          <h1 className="mb-2 text-5xl leading-tight font-semibold uppercase sm:text-6xl lg:text-7xl">Spēles</h1>
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
            <nav aria-label="Komandas" className="flex min-w-0 gap-6 overflow-x-auto sm:gap-8">
              {teamNames.map((name) => <button key={name} type="button" aria-pressed={activeTeam === name} onClick={() => { setActiveTeam(name); setLeagueLabel(""); }} className={cn("relative flex shrink-0 items-center pt-3 pb-2 text-base uppercase sm:text-lg", activeTeam === name && "font-semibold after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-white")}>{name}</button>)}
            </nav>
            <div className="flex shrink-0 flex-wrap items-center gap-6 pb-1">
              <DrawerTrigger className="flex min-h-11 items-center justify-center gap-2 bg-white px-5 text-xs font-semibold text-black uppercase disabled:opacity-40"><CalendarDays className="size-5" aria-hidden="true" />Skatīt kalendārā</DrawerTrigger>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fafafa] px-6 pt-10 pb-16 text-black sm:px-10 sm:pt-12 lg:px-14">
        <div className="mx-auto max-w-[1920px]">
          <div role="tablist" aria-label="Spēļu skats" className="mx-auto mb-6 flex w-fit max-w-full border-b border-black/10">
            {VIEWS.map((item) => <button key={item.id} id={`games-tab-${item.id}`} type="button" role="tab" aria-selected={view === item.id} aria-controls={`games-panel-${item.id}`} onClick={() => setView(item.id)} onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const index = VIEWS.findIndex((tab) => tab.id === item.id);
              const next = event.key === "Home" ? 0 : event.key === "End" ? VIEWS.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + VIEWS.length) % VIEWS.length;
              setView(VIEWS[next].id);
              document.getElementById(`games-tab-${VIEWS[next].id}`)?.focus();
            }} tabIndex={view === item.id ? 0 : -1} className={cn("border-b-4 px-4 pt-3 pb-1 text-sm font-semibold uppercase sm:px-8 sm:text-lg", view === item.id ? "border-black text-black" : "border-transparent text-black/40")}>{item.label}</button>)}
          </div>

          <div id={`games-panel-${view}`} role="tabpanel" aria-labelledby={`games-tab-${view}`}>
            {view === "table" ? (
              <>
                <div className="mb-8 flex flex-col items-center gap-4">
                  {teamLeagues.length > 1 && <select aria-label="Līga" value={league?.label ?? ""} onChange={(event) => setLeagueLabel(event.target.value)} className="max-w-full border-b border-black/20 bg-transparent px-3 py-2 text-center text-base font-semibold">{teamLeagues.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}</select>}
                  <Image src={leagueLogo ?? "/fk-olaine-crest-v2.png"} alt={leagueLogo ? league?.label ?? "Līgas logo" : "FK Olaine"} width={120} height={120} className="size-30 object-contain" onError={() => { if (leagueLogo) setFailedLogo(leagueLogo); }} />
                </div>
                {league && league.standings.length > 0 ? (
                  <div role="region" aria-label="Turnīra tabula" tabIndex={0} className="overflow-x-auto">
                    <table className="w-full min-w-[700px] border-collapse text-sm sm:text-base">
                      <caption className="sr-only">{league.label} — aktuālā turnīra tabula</caption>
                      <thead><tr className="border-y-2 border-black text-left uppercase"><th scope="colgroup" className="px-3 py-5" colSpan={2}>Komanda</th>{["S", "U", "N", "Z", "+/−", "Punkti"].map((name) => <th key={name} scope="col" className="px-4 py-5 text-center">{name}</th>)}</tr></thead>
                      <tbody>{league.standings.map((row) => <tr key={`${row.pos}-${row.team}`} className={cn("border-b border-black/10", row.isOlaine && "bg-black/5 font-semibold")}>
                        <td className="w-12 px-3 py-5 text-center">{row.pos}</td>
                        <th scope="row" className="px-2 py-4 text-left font-normal"><span className="flex items-center gap-3">{row.logo && <Image src={row.logo} alt="" width={28} height={28} className="size-7 object-contain" />}<span className="uppercase">{row.team}</span></span></th>
                        {[row.played, row.wins, row.draws, row.losses, row.goalDiff, row.points].map((value, index) => <td key={index} className="px-4 py-5 text-center tabular-nums">{value}</td>)}
                      </tr>)}</tbody>
                    </table>
                  </div>
                ) : <div className="border border-black/10 px-6 py-16 text-center"><h2 className="text-xl font-semibold">Turnīra tabula pašlaik nav pieejama</h2><p className="mt-3 text-black/55">Izvēlies citu komandu vai atgriezies vēlāk.</p></div>}
              </>
            ) : displayedGames.length > 0 ? (
              <UpcomingMatches games={displayedGames} leagues={teamLeagues} completed={view === "results"} />
            ) : <div className="border border-black/10 px-6 py-16 text-center"><h2 className="text-xl font-semibold">{view === "fixtures" ? "Gaidāmo spēļu nav" : "Aizvadīto spēļu nav"}</h2><p className="mt-3 text-black/55">Izvēlies citu komandu.</p></div>}
          </div>
        </div>
      </section>
      <DrawerContent className="!h-dvh !max-h-dvh !w-[min(100vw,520px)] border-none bg-white shadow-xl data-[swipe-direction=right]:rounded-none motion-reduce:transition-none" overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-sm">
        <div className="flex items-center justify-between bg-black px-6 py-4 text-white">
          <div><DrawerTitle className="text-2xl text-white">Spēļu kalendārs</DrawerTitle><p className="mt-1 text-sm text-white/60">{activeTeam}</p></div>
          <DrawerClose aria-label="Aizvērt kalendāru" className="flex size-11 items-center justify-center"><X className="size-6" /></DrawerClose>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <GamesMonthCalendar games={teamGames} activeDateKey={calendarDate} onSelectDate={setCalendarDate} className="!ml-0 !w-full !rounded-none !bg-black" />
          <div className="p-6">
            {calendarDate ? <div className="space-y-5">{teamGames.filter((game) => game.rawDate === calendarDate).map((game) => <MatchListCard key={game.id} game={game} league={teamLeagues.find((item) => item.label === game.league) ?? (teamLeagues.length === 1 ? teamLeagues[0] : undefined)} completed={matchKickoff(game) <= Date.now()} compact />)}</div> : <p className="text-sm text-black/60">Izvēlies atzīmēto datumu, lai skatītu spēles informāciju.</p>}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
