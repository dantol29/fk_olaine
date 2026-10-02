"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Info } from "lucide-react";

import { TeamLogo } from "@/components/game-fixture-card";
import { YouTubeIcon } from "@/components/social-icons";
import { cn } from "@/lib/utils";
import { isOlaine } from "@/lib/games";
import type { GameListItem } from "@/lib/games-server";
import type { LeagueStandings } from "@/lib/league-standings-server";

export function matchKickoff(game: GameListItem) {
  const offset = new Intl.DateTimeFormat("en", { timeZone: "Europe/Riga", timeZoneName: "longOffset" }).formatToParts(new Date(`${game.rawDate}T12:00:00Z`)).find((part) => part.type === "timeZoneName")?.value.replace("GMT", "") || "+00:00";
  return new Date(`${game.rawDate}T${game.time}:00${offset}`).getTime();
}

function Countdown({ game }: { game: GameListItem }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, Math.floor((matchKickoff(game) - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [game]);
  if (remaining === 0) return <p className="text-lg font-semibold">Spēle sākusies</p>;
  const values = remaining === null ? [null, null, null, null] : [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60];
  return (
    <div aria-label="Laiks līdz spēles sākumam" className="flex justify-center gap-5 sm:gap-8">
      {values.map((value, index) => <div key={index} className="text-center"><span className="block text-3xl leading-none tabular-nums sm:text-4xl">{value === null ? "—" : String(value).padStart(2, "0")}</span><span className="mt-2 block text-xs text-white/80 sm:text-sm">{["Dienas", "Stundas", "Minūtes", "Sekundes"][index]}</span></div>)}
    </div>
  );
}

function FixtureLeagueLogo({ league, large = false }: { league?: LeagueStandings; large?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  const logo = league?.logoUrl && league.logoUrl !== failed ? league.logoUrl : null;
  return <Image src={logo ?? "/fk-olaine-crest-v2.png"} alt={logo ? league?.label ?? "Līgas logo" : "FK Olaine"} width={large ? 90 : 56} height={large ? 90 : 56} className={large ? "size-20 object-contain" : "size-12 object-contain"} onError={() => { if (logo) setFailed(logo); }} />;
}

function VideoLink() {
  return <a href="https://www.youtube.com/c/avanakeks/videos" target="_blank" rel="noopener noreferrer" className="flex min-h-16 items-center justify-center gap-3 bg-white px-4 text-sm text-black hover:underline"><span>Kluba video</span><YouTubeIcon className="size-6 text-club-red" aria-hidden="true" /><span className="font-semibold">YouTube</span></a>;
}

export function UpcomingMatches({ games, leagues, completed = false }: { games: GameListItem[]; leagues: LeagueStandings[]; completed?: boolean }) {
  const next = games[0];
  const hasScore = (game: GameListItem) => game.homeScore != null && game.awayScore != null;
  const leagueFor = (game: GameListItem) => leagues.find((league) => league.label === game.league) ?? (leagues.length === 1 ? leagues[0] : undefined);
  const groups = new Map<string, GameListItem[]>();
  for (const game of games) {
    const key = game.rawDate.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), game]);
  }
  if (!next) return null;

  return (
    <>
      <div className="mx-auto mb-12 max-w-[1280px]">
        <section aria-labelledby="match-banner-heading" className={cn("relative overflow-hidden bg-black px-5 pt-6 text-white sm:px-8", completed ? "min-h-[280px] pb-8 sm:min-h-[320px] sm:pb-10" : "pb-12 sm:pb-16")}>
          <Image src="/stadions.jpg" alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-black/75" />
          <div className="relative">
            <h2 id="match-banner-heading" className="text-xl font-semibold uppercase sm:text-2xl">{completed ? "Pēdējā spēle" : "Nākamā spēle"}</h2>
            <div className="mt-4 flex justify-center sm:-mt-7"><FixtureLeagueLogo league={leagueFor(next)} large /></div>
            <div className={cn("mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8", completed ? "mt-6 max-w-[1280px] sm:mt-10" : "mt-10 max-w-6xl sm:mt-14")}>
              <div className="flex min-w-0 flex-col-reverse items-center gap-4 lg:flex-row lg:justify-end">
                <h3 className={cn("text-center font-semibold uppercase lg:text-right", completed ? "text-xl sm:text-2xl" : "text-sm sm:text-xl lg:text-2xl")}>{next.home.name}</h3><TeamLogo team={next.home} className={cn("!size-16 !rounded-none !bg-transparent !ring-0", completed ? "sm:!size-28" : "sm:!size-24")} />
              </div>
              <div className="text-center">
                {completed ? (
                  <div aria-label={`Rezultāts: ${next.homeScore ?? "nav pieejams"} pret ${next.awayScore ?? "nav pieejams"}`} className="grid grid-cols-[2ch_auto_2ch] items-center gap-1 text-4xl leading-none font-semibold tabular-nums sm:gap-5 sm:text-6xl lg:gap-8 lg:text-7xl">
                    <span>{next.homeScore ?? "—"}</span><span aria-hidden="true" className="text-sm font-normal sm:text-xl">:</span><span>{next.awayScore ?? "—"}</span>
                  </div>
                ) : <p className="text-3xl font-semibold sm:text-4xl">{next.time}</p>}
                {completed && !hasScore(next) && <p className="mt-2 text-xs text-white/70">Rezultāts nav pieejams</p>}
                {!completed && <><p className="mt-4 text-sm font-semibold sm:text-lg">{Number(next.day)}. {next.month.toLowerCase()} {next.year}</p><p className="mt-1 text-xs text-white/80 sm:text-sm">{next.venue}</p></>}
              </div>
              <div className="flex min-w-0 flex-col items-center gap-4 lg:flex-row">
                <TeamLogo team={next.away} className={cn("!size-16 !rounded-none !bg-transparent !ring-0", completed ? "sm:!size-28" : "sm:!size-24")} />
                <h3 className={cn("text-center font-semibold uppercase lg:text-left", completed ? "text-xl sm:text-2xl" : "text-sm sm:text-xl lg:text-2xl")}>{next.away.name}</h3>
              </div>
            </div>
            {!completed && <div className="mt-10 sm:mt-12"><Countdown game={next} /></div>}
          </div>
        </section>
        <VideoLink />
      </div>

      {[...groups].map(([month, fixtures]) => (
        <section key={month} aria-labelledby={`fixtures-${month}`} className="mb-10">
          <h2 id={`fixtures-${month}`} className="mb-6 text-center text-lg font-semibold text-black/40 uppercase">{new Intl.DateTimeFormat("lv-LV", { month: "long", year: "numeric", timeZone: "Europe/Riga" }).format(new Date(`${month}-15T12:00:00Z`))}</h2>
          <div className="space-y-5">
            {fixtures.map((game) => {
              return <MatchListCard key={game.id} game={game} league={leagueFor(game)} completed={completed} />;
            })}
          </div>
        </section>
      ))}
    </>
  );
}

export function MatchListCard({ game, league, completed = false, compact = false }: { game: GameListItem; league?: LeagueStandings; completed?: boolean; compact?: boolean }) {
              const home = isOlaine(game.home.name);
              const opponent = home ? game.away : game.home;
              return <article className="border border-black/10 bg-white">
                <div className={cn("grid items-center", compact ? "grid-cols-[24px_64px_minmax(0,1fr)] gap-3 p-4" : "grid-cols-[36px_1fr] gap-5 p-5 sm:grid-cols-[36px_56px_100px_1fr] sm:gap-6 sm:p-7 lg:grid-cols-[48px_72px_140px_1fr_220px] lg:gap-8")}>
                  <span title={home ? "Mājas spēle" : "Izbraukuma spēle"} className="text-lg font-semibold">{home ? "M" : "I"}</span>
                  <div className={compact ? "hidden" : "hidden sm:block"}><FixtureLeagueLogo league={league} /></div>
                  <div><p className={cn("font-semibold", compact ? "text-lg" : "text-2xl")}>{game.time}</p><p className={cn("mt-1 text-black/45", compact ? "text-xs" : "text-sm")}>{Number(game.day)}. {game.month.toLowerCase()}</p></div>
                  <div className={cn("flex min-w-0 items-center", compact ? "gap-2" : "col-span-2 gap-4 sm:col-span-1")}>
                    <TeamLogo team={opponent} className={cn("!rounded-none !ring-0", compact ? "!size-9 shrink-0" : "!size-14")} />
                    {completed ? <div className="min-w-0">
                      <p className={cn("grid grid-cols-[3ch_minmax(0,1fr)] items-start gap-3 uppercase", compact ? "text-xs" : "text-lg sm:text-xl")}><span className="border-r border-black/20 pr-3 text-center font-semibold tabular-nums">{game.homeScore ?? "—"}</span><span>{game.home.name}</span></p>
                      <p className={cn("mt-1 grid grid-cols-[3ch_minmax(0,1fr)] items-start gap-3 uppercase", compact ? "text-xs" : "text-lg sm:text-xl")}><span className="border-r border-black/20 pr-3 text-center font-semibold tabular-nums">{game.awayScore ?? "—"}</span><span>{game.away.name}</span></p>
                      {(game.homeScore == null || game.awayScore == null) && <p className="mt-2 text-xs text-black/45">Rezultāts nav pieejams</p>}
                    </div> : <div className="min-w-0"><h3 className={cn("font-semibold uppercase", compact ? "text-sm" : "text-lg sm:text-xl")}>{opponent.name}</h3><p className={cn("mt-1 text-black/45", compact ? "text-xs" : "text-sm")}>{game.venue}</p></div>}
                  </div>
                  {!compact && <div className="col-span-2 sm:col-span-4 lg:col-span-1 lg:border-l lg:border-black/15 lg:pl-6">
                    {game.fixturesUrl ? (
                      <a href={game.fixturesUrl} className={cn("flex min-h-11 items-center justify-center gap-2 border-2 border-black px-3 text-xs font-semibold uppercase", completed ? "bg-black text-white hover:bg-black/80" : "hover:bg-black hover:text-white")}>
                        <Info className="size-4" aria-hidden="true" />Spēles informācija
                      </a>
                    ) : (
                      <span title="LFF spēļu saite nav pievienota" className="flex min-h-11 items-center justify-center gap-2 border-2 border-black/20 px-3 text-xs font-semibold text-black/40 uppercase">
                        <Info className="size-4" aria-hidden="true" />Spēles informācija
                      </span>
                    )}
                  </div>}
                </div>
              </article>;
}
