"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LeagueStandings } from "@/lib/league-standings-server";
import type { CombinedSchedule } from "@/lib/shared-calendar";
import { MonthCalendar } from "@/components/month-calendar";
import { StandingsTable } from "@/components/standings-table";

export function HomeLeagueTable({ leagues, schedule, today, minMonth, maxMonth, upcoming }: {
  leagues: LeagueStandings[];
  schedule: CombinedSchedule;
  today: string;
  minMonth: string;
  maxMonth: string;
  upcoming: ReactNode;
}) {
  const [selected, setSelected] = useState(0);
  const league = leagues[selected] ?? leagues[0];
  return (
    <section aria-labelledby="home-table-heading" className="bg-club-navy px-6 pb-12 sm:px-10 sm:pb-16 lg:px-14">
      <div className="mx-auto grid max-w-[1280px] gap-12 text-white lg:grid-cols-2 lg:items-start lg:gap-x-10 lg:gap-y-12 lg:pt-16 2xl:max-w-[1600px]">
        <div className="min-w-0 lg:col-span-2 lg:row-start-1">{upcoming}</div>
        <div className="min-w-0 lg:col-start-2 lg:row-start-2">
          <div className="mb-4 flex min-h-10 items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <h2 id="home-table-heading" aria-live="polite" aria-atomic="true" className="min-w-0 text-2xl leading-tight font-semibold break-words uppercase sm:text-3xl">{league?.label ?? "Turnīra tabula"}</h2>
            </div>
            {leagues.length > 1 && <div className="flex shrink-0 items-center gap-2">
              <button type="button" aria-label="Iepriekšējā līga" onClick={() => setSelected((current) => (current - 1 + leagues.length) % leagues.length)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" aria-label="Nākamā līga" onClick={() => setSelected((current) => (current + 1) % leagues.length)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
            </div>}
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/15 bg-transparent text-white [&_thead_tr]:border-0 [&_thead_tr]:bg-club-navy-light [&_thead_tr]:text-white [&_thead_th]:py-4 [&_tbody_tr]:border-white/10 [&_tbody_tr:last-child]:border-b-0 [&_.text-club-red]:text-rose-300 [&_p]:text-white/65">
            <StandingsTable rows={league?.standings ?? []} label={league?.label ?? "Turnīra tabula"} compact expandedDesktop />
          </div>
        </div>
        <aside aria-label="Kalendārs" className="min-w-0 text-white lg:col-start-1 lg:row-start-2">
          {schedule.sharedStatus === "stale" && <p role="status" className="mb-3 text-sm text-amber-200">AFA Olaine dati var būt novecojuši.</p>}
          {schedule.sharedStatus === "unavailable" && <p role="status" className="mb-3 text-sm text-amber-200">AFA Olaine notikumi pašlaik nav pieejami. Tiek rādīti FK Olaine notikumi.</p>}
          <MonthCalendar events={schedule.events} leagues={leagues} today={today} minMonth={minMonth} maxMonth={maxMonth} compact theme="home" />
        </aside>
      </div>
    </section>
  );
}
