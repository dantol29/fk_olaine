"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LeagueStandings } from "@/lib/league-standings-server";
import type { CombinedSchedule } from "@/lib/shared-calendar";
import { MonthCalendar } from "@/components/month-calendar";
import { StandingsTable } from "@/components/standings-table";

export function HomeLeagueTable({ leagues, schedule, today, minMonth, maxMonth }: {
  leagues: LeagueStandings[];
  schedule: CombinedSchedule;
  today: string;
  minMonth: string;
  maxMonth: string;
}) {
  const [selected, setSelected] = useState(0);
  const [failedLogos, setFailedLogos] = useState<string[]>([]);
  const league = leagues[selected] ?? leagues[0];
  const logo = league?.logoUrl && !failedLogos.includes(league.logoUrl) ? league.logoUrl : null;
  return (
    <section aria-labelledby="home-table-heading" className="bg-white px-6 pb-12 sm:px-10 sm:pb-16 lg:px-14">
      <div className="mx-auto grid max-w-[1280px] gap-16 text-black lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-start lg:gap-10">
        <div className="min-w-0 lg:order-2">
          <div className="mb-4 flex items-start justify-between gap-4 lg:mb-8 lg:min-h-20 lg:pt-5">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              {logo && <Image src={logo} alt="" width={40} height={40} className="hidden size-10 shrink-0 object-contain sm:block" onError={() => setFailedLogos((failed) => [...failed, logo])} />}
              <h2 id="home-table-heading" aria-live="polite" aria-atomic="true" className="min-w-0 text-2xl leading-tight font-semibold break-words uppercase sm:text-3xl">{league?.label ?? "Turnīra tabula"}</h2>
            </div>
            {leagues.length > 1 && <div className="flex shrink-0 items-center gap-2">
              <button type="button" aria-label="Iepriekšējā līga" onClick={() => setSelected((current) => (current - 1 + leagues.length) % leagues.length)} className="flex h-10 w-10 items-center justify-center border-2 border-black text-black transition hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" aria-label="Nākamā līga" onClick={() => setSelected((current) => (current + 1) % leagues.length)} className="flex h-10 w-10 items-center justify-center border-2 border-black text-black transition hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
            </div>}
          </div>
          <StandingsTable rows={league?.standings ?? []} label={league?.label ?? "Turnīra tabula"} compact />
        </div>
        <aside aria-label="Kalendārs" className="min-w-0 lg:order-1 lg:pt-5">
          {schedule.sharedStatus === "stale" && <p role="status" className="mb-3 text-sm text-amber-800">AFA Olaine dati var būt novecojuši.</p>}
          {schedule.sharedStatus === "unavailable" && <p role="status" className="mb-3 text-sm text-amber-800">AFA Olaine notikumi pašlaik nav pieejami. Tiek rādīti FK Olaine notikumi.</p>}
          <MonthCalendar events={schedule.events} leagues={leagues} today={today} minMonth={minMonth} maxMonth={maxMonth} compact theme="home" />
        </aside>
      </div>
    </section>
  );
}
