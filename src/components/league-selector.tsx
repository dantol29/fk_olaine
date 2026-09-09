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

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex flex-1 flex-col overflow-hidden px-4 pt-6 pb-4 sm:rounded-[1.5rem] sm:bg-white sm:px-8 sm:pt-8 sm:pb-6">
        <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6">
          <div className="min-w-0">
            <h3 className="text-3xl text-club-navy sm:text-4xl">
              {leagues[activeLeague]?.label ?? ""}
            </h3>
            <p className="mt-1 text-sm text-slate-400">Turnīra tabula {currentYear}</p>
          </div>
          <a
            href={leagues[activeLeague]?.url ?? "https://lff.lv/"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 py-1.5 pr-1.5 pl-4 text-xs font-semibold text-club-navy transition hover:border-slate-300 sm:gap-3 sm:pl-5 sm:text-sm"
          >
            Skatīt visas
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 sm:h-8 sm:w-8">
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </a>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 sm:mb-4">
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
              {index === activeLeague && <Trophy className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />}
              {league.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <table
            key={`table-${activeLeague}`}
            className="w-full border-collapse text-sm"
          >
            <thead>
              <tr className="text-left text-xs text-slate-400">
                <th className="w-10 pr-3 pb-3 pl-2">#</th>
                <th className="pb-3">Komanda</th>
                <th className="pr-3 pb-3 text-center sm:pr-0">
                  <span className="sm:hidden">S</span>
                  <span className="hidden sm:inline">Spēles</span>
                </th>
                <th className="hidden pb-3 text-center sm:table-cell">Vārti</th>
                <th className="pb-3 pr-1 text-center">
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
                        row.isOlaine && "bg-club-red/5",
                      )}
                      style={{ animationDelay: `${enterDelay}ms` }}
                    >
                      <td className={cn("py-4 pr-3 pl-2 sm:py-5", row.isOlaine && "rounded-l-xl")}>
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-bold tabular-nums",
                            row.isOlaine
                              ? "bg-club-red/10 text-club-red"
                              : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {row.pos}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "py-4 pr-2 sm:py-5",
                          row.isOlaine ? "text-club-red font-semibold" : "text-club-navy",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {row.logo && (
                            <Image
                              src={row.logo}
                              alt=""
                              width={38}
                              height={38}
                              className="h-9.5 w-9.5 shrink-0 rounded-full bg-white object-contain ring-1 ring-black/5"
                            />
                          )}
                          <span className="truncate text-base sm:text-sm">{row.team}</span>
                        </div>
                      </td>
                      <td className="py-4 pr-3 text-center font-mono text-sm tabular-nums text-slate-600 sm:py-5 sm:pr-0">
                        {row.played}
                      </td>
                      <td className="hidden py-4 text-center font-mono text-sm tabular-nums text-slate-600 sm:table-cell sm:py-5">
                        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                      </td>
                      <td
                        className={cn(
                          "py-4 pr-2 text-center font-mono text-base font-bold tabular-nums sm:py-5",
                          row.isOlaine ? "text-club-red rounded-r-xl" : "text-club-navy",
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
