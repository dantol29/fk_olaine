"use client";

import Image from "next/image";
import { ArrowRight, Trophy } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { StandingRow } from "@/lib/standings";

type LeagueSelectorProps = {
  leagues: { label: string; standings: StandingRow[]; url: string }[];
};

export function LeagueSelector({ leagues }: LeagueSelectorProps) {
  const [activeLeague, setActiveLeague] = useState(0);

  const standings = leagues[activeLeague]?.standings ?? [];
  const currentYear = new Date().getFullYear();
  const activeLabel = leagues[activeLeague]?.label ?? "";

  return (
    <div className="flex h-auto flex-col lg:h-full">
      <div className="relative flex flex-1 flex-col pt-6 pb-4 sm:overflow-hidden sm:rounded-[1.5rem] sm:bg-white sm:px-8 sm:pt-8 sm:pb-6">
        <div className="mb-4 flex items-center justify-center gap-3 sm:mb-6 sm:justify-between">
          <div className="relative flex min-h-24 w-full min-w-0 flex-col items-center justify-center sm:min-h-0 sm:w-auto sm:items-start">
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 -rotate-1 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:hidden"
            >
              {activeLabel}
            </span>
            <h3 className="relative text-center text-3xl tracking-[-0.02em] text-club-navy sm:text-left sm:text-4xl">
              {leagues[activeLeague]?.label ?? ""}
            </h3>
          </div>
          <a
            href={leagues[activeLeague]?.url ?? "https://lff.lv/"}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 py-1.5 pr-1.5 pl-4 text-xs font-semibold text-club-navy transition hover:border-slate-300 sm:flex sm:gap-3 sm:pl-5 sm:text-sm"
          >
            Skatīt visas
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 sm:h-8 sm:w-8">
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </a>
        </div>

        <div className="overflow-visible lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <table
            key={`table-${activeLeague}`}
            className="w-full border-collapse text-sm"
          >
            <thead>
              <tr className="text-left text-xs text-slate-400">
                <th colSpan={2} className="pb-3">
                  <div className="flex flex-wrap gap-2">
                    {leagues.map((league, index) => (
                      <button
                        key={league.label}
                        type="button"
                        onClick={() => setActiveLeague(index)}
                        aria-pressed={index === activeLeague}
                        className={cn(
                          "flex items-center gap-2 rounded-[1rem] px-4 py-2.5 text-xs font-semibold uppercase transition sm:px-5 sm:py-3 sm:text-sm",
                          index === activeLeague
                            ? "bg-club-red text-white"
                            : "bg-slate-100 text-club-navy hover:bg-slate-200",
                        )}
                      >
                        {league.label}
                      </button>
                    ))}
                  </div>
                </th>
                <th className="hidden pb-3 text-center sm:table-cell sm:pr-0">
                  Spēles
                </th>
                <th className="hidden pb-3 text-center sm:table-cell">Vārti</th>
                <th className="hidden min-[400px]:table-cell pb-3 pr-1 text-center">
                  <span className="sm:hidden">P</span>
                  <span className="hidden sm:inline">Punkti</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-sm text-slate-400"
                  >
                    Tabula pašlaik nav pieejama.
                  </td>
                </tr>
              ) : (
                standings.map((row, index) => {
                  const enterDelay = index * 40;
                  return (
                    <tr
                      key={row.pos}
                      className={cn(
                        "league-row-enter border-t border-slate-100",
                      )}
                      style={{ animationDelay: `${enterDelay}ms` }}
                    >
                      <td
                        className={cn(
                          "py-4 pr-3 lg:pr-0 pl-0 sm:py-5",
                          row.isOlaine && "rounded-l-xl",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center font-mono text-lg font-bold tabular-nums",
                            row.isOlaine ? "text-club-red" : "text-slate-600",
                          )}
                        >
                          {row.pos}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "py-4 pr-2 sm:py-5",
                          row.isOlaine
                            ? "text-club-red font-semibold"
                            : "text-club-navy",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {row.logo && (
                            <Image
                              src={row.logo}
                              alt=""
                              width={48}
                              height={48}
                              className="h-11 w-11 shrink-0 rounded-full bg-white object-contain ring-1 ring-black/5"
                            />
                          )}
                          <span className="truncate text-base uppercase font-semibold sm:text-sm">
                            {row.team}
                          </span>
                        </div>
                      </td>
                      <td className="hidden py-4 text-center font-mono text-sm tabular-nums text-slate-600 sm:table-cell sm:py-5 sm:pr-3">
                        {row.played}
                      </td>
                      <td className="hidden py-4 text-center font-mono text-sm tabular-nums text-slate-600 sm:table-cell sm:py-5">
                        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                      </td>
                      <td
                        className={cn(
                          "hidden min-[400px]:table-cell py-4 pr-2 text-center font-mono text-base font-bold tabular-nums sm:py-5",
                          row.isOlaine
                            ? "text-club-red rounded-r-xl"
                            : "text-club-navy",
                        )}
                      >
                        {row.points}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
