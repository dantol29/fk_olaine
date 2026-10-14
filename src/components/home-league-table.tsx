"use client";

import { useState } from "react";
import Image from "next/image";
import type { LeagueStandings } from "@/lib/league-standings-server";
import { StandingsTable } from "@/components/standings-table";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export function HomeLeagueTable({ leagues }: { leagues: LeagueStandings[] }) {
  const [selected, setSelected] = useState(0);
  const [failedLogos, setFailedLogos] = useState<string[]>([]);
  const league = leagues[selected] ?? leagues[0];
  const logo = league?.logoUrl && !failedLogos.includes(league.logoUrl) ? league.logoUrl : null;
  const leagueLogo = logo
    ? <Image src={logo} alt={league?.label ?? "Līgas logo"} width={64} height={64} className="size-16 object-contain" onError={() => setFailedLogos((failed) => [...failed, logo])} />
    : <span className="text-sm font-semibold uppercase">{league?.label ?? "Līga"}</span>;
  return (
    <section aria-labelledby="home-table-heading" className="bg-white px-6 pb-12 sm:px-10 sm:pb-16 lg:px-14">
      <div className="mx-auto max-w-[1280px] text-black">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 id="home-table-heading" className="text-2xl font-semibold uppercase sm:text-3xl">TABULA</h2>
          {leagues.length > 1 ? (
            <Select value={selected} onValueChange={(value) => { if (value !== null) setSelected(value); }} items={leagues.map((item, index) => ({ value: index, label: item.label }))}>
              <SelectTrigger aria-label={`Izvēlēties līgu: ${league?.label ?? ""}`} className="shrink-0 rounded-none bg-transparent px-2 py-1 hover:bg-club-navy/5 focus-visible:ring-club-navy/30">
                {leagueLogo}
              </SelectTrigger>
              <SelectContent className="w-72 max-w-[calc(100vw-3rem)] rounded-none border-club-navy/15 p-2 text-club-navy shadow-lg motion-reduce:transition-none">
                {leagues.map((item, index) => {
                  const itemLogo = item.logoUrl && !failedLogos.includes(item.logoUrl) ? item.logoUrl : null;
                  return <SelectItem key={item.id ?? item.label} value={index} className="rounded-none py-3 data-highlighted:bg-club-navy/5 data-selected:bg-club-navy/5">
                    <span className="flex items-center gap-3">
                      {itemLogo && <Image src={itemLogo} alt="" width={36} height={36} className="size-9 shrink-0 object-contain" onError={() => setFailedLogos((failed) => [...failed, itemLogo])} />}
                      <span className="text-sm font-semibold uppercase">{item.label}</span>
                    </span>
                  </SelectItem>;
                })}
              </SelectContent>
            </Select>
          ) : <div className="shrink-0">{leagueLogo}</div>}
        </div>
        <StandingsTable rows={league?.standings ?? []} label={league?.label ?? "Turnīra tabula"} />
      </div>
    </section>
  );
}
