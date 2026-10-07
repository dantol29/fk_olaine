"use client";

import Image from "next/image";
import { CalendarDays, X } from "lucide-react";
import { useState } from "react";

import { leagueForGame } from "@/lib/game-league";
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
  const [view, setView] = useState<View>("fixtures");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<string | null>(null);
  const year = String(new Date().getFullYear());
  const [leagueLabel, setLeagueLabel] = useState("");
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const teamNames = [...new Set([...games.map((game) => game.teamName), ...leagues.flatMap((league) => league.teamName ? [league.teamName] : [])])];
  const activeTeam = teamNames.includes(selectedTeam) ? selectedTeam : "";
  const teamGames = games.filter((game) => (!activeTeam || game.teamName === activeTeam) && game.year === year);
  const upcoming = teamGames.filter((game) => !game.isPast && matchKickoff(game) > Date.now());
  const displayedGames = view === "results" ? teamGames.filter((game) => matchKickoff(game) <= Date.now()).reverse() : upcoming;
  const teamLeagues = leagues.filter((league) => !activeTeam || league.teamName === activeTeam);
  const league = teamLeagues.find((item) => String(item.id) === leagueLabel) ?? teamLeagues[0];
  const leagueLogo = league?.logoUrl && league.logoUrl !== failedLogo ? league.logoUrl : null;

  return (
    <Drawer swipeDirection="right" open={calendarOpen} onOpenChange={setCalendarOpen}>
      <section className="games-page-hero bg-black px-6 pt-6 text-white sm:px-10 sm:pt-8 lg:px-14">
        <div className="mx-auto max-w-[1920px]">
          <h1 className="mb-2 text-5xl leading-tight font-semibold uppercase sm:text-6xl lg:text-7xl">Spēles</h1>
          <div className="flex flex-col justify-between lg:flex-row lg:items-end lg:gap-3">
            <label className="my-3 flex min-w-0 flex-col gap-2 lg:my-2">
              <span className="text-xs text-white/60 uppercase">Komandas</span>
              <select
                value={activeTeam}
                onChange={(event) => { setActiveTeam(event.target.value); setLeagueLabel(""); setCalendarDate(null); }}
                className="min-h-11 w-full max-w-sm border border-white/30 bg-black px-4 py-2 text-base text-white focus-visible:outline-white"
              >
                <option value="">Visas komandas</option>
                {teamNames.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <div className="-mx-6 flex shrink-0 items-center justify-end bg-white px-6 py-2 sm:-mx-10 sm:px-10 lg:mx-0 lg:bg-transparent lg:px-0 lg:pt-0 lg:pb-1">
              <DrawerTrigger className="flex min-h-11 items-center justify-center gap-2 bg-club-red px-5 text-xs font-semibold text-white uppercase lg:bg-white lg:text-black"><CalendarDays className="size-5" aria-hidden="true" />Skatīt kalendārā</DrawerTrigger>
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
                  {teamLeagues.length > 1 && <select aria-label="Līga" value={league?.id ?? ""} onChange={(event) => setLeagueLabel(event.target.value)} className="max-w-full border-b border-black/20 bg-transparent px-3 py-2 text-center text-base font-semibold">{teamLeagues.map((item) => <option key={item.id ?? item.label} value={item.id}>{item.label}{!activeTeam && item.teamName ? ` — ${item.teamName}` : ""}</option>)}</select>}
                  <Image src={leagueLogo ?? "/fk-olaine-crest-v2.png"} alt={leagueLogo ? league?.label ?? "Līgas logo" : "FK Olaine"} width={120} height={120} className="size-30 object-contain" onError={() => { if (leagueLogo) setFailedLogo(leagueLogo); }} />
                </div>
                {league && league.standings.length > 0 ? (
                  <div role="region" aria-label="Turnīra tabula" tabIndex={0} className="overflow-x-auto">
                    <table className="w-full table-fixed border-collapse text-sm sm:min-w-[700px] sm:table-auto sm:text-base">
                      <caption className="sr-only">{league.label} — aktuālā turnīra tabula</caption>
                      <colgroup><col className="w-6 sm:w-12" /><col /><col className="w-9 sm:w-auto" /><col className="hidden sm:table-column" /><col className="hidden sm:table-column" /><col className="hidden sm:table-column" /><col className="w-10 sm:w-auto" /><col className="w-12 sm:w-auto" /></colgroup>
                      <thead><tr className="border-y-2 border-black text-left uppercase"><th scope="colgroup" className="px-1 py-5 sm:px-3" colSpan={2}>Komanda</th>{["S", "U", "N", "Z", "+/−", "Punkti"].map((name, index) => <th key={name} scope="col" className={cn("px-1 py-5 text-center sm:px-4", index > 0 && index < 4 && "hidden sm:table-cell")}>{name}</th>)}</tr></thead>
                      <tbody>{league.standings.map((row) => <tr key={`${row.pos}-${row.team}`} className={cn("border-b border-black/10", row.isOlaine && "bg-black/5 font-semibold")}>
                        <td className="px-1 py-5 text-center text-xs sm:px-3 sm:text-base">{row.pos}</td>
                        <th scope="row" className="px-1 py-4 text-left font-normal sm:px-2"><span className="flex items-center gap-2 sm:gap-3">{row.logo && <Image src={row.logo} alt="" width={28} height={28} className="size-5 shrink-0 object-contain sm:size-7" />}<span className="min-w-0 break-words uppercase">{row.team}</span></span></th>
                        {[row.played, row.wins, row.draws, row.losses, row.goalDiff, row.points].map((value, index) => <td key={index} className={cn("px-1 py-5 text-center tabular-nums sm:px-4", index > 0 && index < 4 && "hidden sm:table-cell")}>{value}</td>)}
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
          <div><DrawerTitle className="text-2xl text-white">Spēļu kalendārs</DrawerTitle><p className="mt-1 text-sm text-white/60">{activeTeam || "Visas komandas"}</p></div>
          <DrawerClose aria-label="Aizvērt kalendāru" className="flex size-11 items-center justify-center"><X className="size-6" /></DrawerClose>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <GamesMonthCalendar games={teamGames} activeDateKey={calendarDate} onSelectDate={setCalendarDate} className="!ml-0 !w-full !rounded-none !bg-black" />
          <div className="p-6">
            {calendarDate ? <div className="space-y-5">{teamGames.filter((game) => game.rawDate === calendarDate).map((game) => <MatchListCard key={game.id} game={game} league={leagueForGame(game, teamLeagues)} completed={matchKickoff(game) <= Date.now()} drawer showInfo={false} />)}</div> : <p className="text-sm text-black/60">Izvēlies atzīmēto datumu, lai skatītu spēles informāciju.</p>}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
