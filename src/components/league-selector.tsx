"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { StandingRow } from "@/lib/standings";

type LeagueSelectorProps = {
  leagues: { label: string; standings: StandingRow[]; url: string }[];
  /** Drops the "Spēles" and "Vārti" columns for narrower layouts (e.g. the
   *  /speles page, where this sits in a slimmer sidebar column). */
  compact?: boolean;
  /** Squares off the left corners on desktop (lg+), where this card sits
   *  flush against another card to its left with no gap (e.g. the
   *  homepage hero's news carousel). */
  flushLeft?: boolean;
};

export function LeagueSelector({ leagues, compact = false, flushLeft = false }: LeagueSelectorProps) {
  const [activeLeague, setActiveLeague] = useState(0);

  const standings = leagues[activeLeague]?.standings ?? [];
  const activeLabel = leagues[activeLeague]?.label ?? "";

  return (
    <div className="flex h-auto flex-col lg:h-full">
      <div
        className={cn(
          "relative flex flex-1 flex-col pt-6 pb-4 sm:overflow-hidden sm:rounded-[1.5rem] sm:bg-white sm:px-8 sm:pt-8 sm:pb-6",
          compact && "lg:rounded-t-none",
          flushLeft && "lg:rounded-l-none",
        )}
      >
        <div className="mb-4 flex items-center justify-center gap-3 sm:mb-6 sm:justify-between">
          <div className="relative flex min-h-24 w-full min-w-0 flex-col items-center justify-center sm:min-h-0 sm:w-auto sm:items-start">
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:hidden"
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

        <div className="league-scroll overflow-visible lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-10 sm:w-12" />
              <col />
              {!compact && <col className="hidden w-16 sm:table-column" />}
              {!compact && <col className="hidden w-16 sm:table-column" />}
              <col className="w-8 sm:w-16" />
            </colgroup>
            <thead>
              <tr className="text-left text-xs text-slate-400">
                <th colSpan={2} className="min-w-0 pb-3 pr-4 sm:pr-6">
                  <div className="flex w-[calc(100vw-1.5rem)] max-w-none flex-nowrap gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-full sm:max-w-full">
                    {leagues.map((league, index) => (
                      <button
                        key={league.label}
                        type="button"
                        onClick={() => setActiveLeague(index)}
                        aria-pressed={index === activeLeague}
                        className={cn(
                          "flex shrink-0 items-center gap-2 rounded-[1rem] px-4 py-2.5 text-xs font-semibold uppercase transition sm:px-5 sm:py-3 sm:text-sm",
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
                {!compact && (
                  <th className="hidden pb-3 text-center sm:table-cell sm:pr-0">
                    S
                  </th>
                )}
                {!compact && (
                  <th className="hidden pb-3 text-center sm:table-cell">
                    V
                  </th>
                )}
                <th className="pb-3 pr-1 text-center">
                  <span className="hidden sm:inline">P</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 ? (
                <tr>
                  <td
                    colSpan={compact ? 3 : 5}
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
                      {!compact && (
                        <td className="hidden py-4 text-center font-mono text-sm tabular-nums text-slate-600 sm:table-cell sm:py-5 sm:pr-3">
                          {row.played}
                        </td>
                      )}
                      {!compact && (
                        <td className="hidden py-4 text-center font-mono text-sm tabular-nums text-slate-600 sm:table-cell sm:py-5">
                          {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                        </td>
                      )}
                      <td
                        className={cn(
                          "py-4 pr-2 text-center font-mono text-base font-bold tabular-nums sm:py-5",
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
