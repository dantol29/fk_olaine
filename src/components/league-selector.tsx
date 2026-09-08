"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { StandingRow } from "@/lib/standings";

const LEAGUES = ["Sieviešu līga", "1. līga", "U16"] as const;

type LeagueSelectorProps = {
  leagues: StandingRow[][];
};

export function LeagueSelector({ leagues }: LeagueSelectorProps) {
  const [activeLeague, setActiveLeague] = useState(0);

  const standings = leagues[activeLeague] ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="league-card relative flex-1 overflow-hidden rounded-[1.5rem] bg-white px-6 pt-8 pb-4 sm:px-8 sm:pt-10 sm:pb-5">
        <div className="mb-5 flex items-center justify-between gap-2">
          <h3 className="text-2xl uppercase text-club-navy sm:text-3xl">
            {LEAGUES[activeLeague]}
          </h3>
          <Link
            href="/speles"
            className="flex shrink-0 items-center gap-3 rounded-full border border-slate-200 py-1.5 pr-1.5 pl-5 text-sm text-club-navy transition hover:border-slate-300"
          >
            Skatīt visas
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2">
          {LEAGUES.map((league, index) => (
            <button
              key={league}
              type="button"
              onClick={() => setActiveLeague(index)}
              aria-pressed={index === activeLeague}
              className={cn(
                "rounded-xl px-4 py-3 text-xs uppercase transition sm:text-sm",
                index === activeLeague
                  ? "bg-club-red text-white"
                  : "bg-slate-100 text-club-navy hover:bg-slate-200",
              )}
            >
              {league}
            </button>
          ))}
        </div>

        <table
          key={`table-${activeLeague}`}
          className="w-full border-collapse text-sm"
        >
          <thead>
            <tr className="text-left text-xs text-slate-400">
              <th className="w-10 pb-2">#</th>
              <th className="pb-2">Komanda</th>
              <th className="pb-2 text-center">Spēles</th>
              <th className="pb-2 text-center">Vārti</th>
              <th className="pb-2 pr-1 text-center">Punkti</th>
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
                    className="league-row-enter border-t border-slate-100"
                    style={{ animationDelay: `${enterDelay}ms` }}
                  >
                    <td className="py-2.5">
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 font-mono text-xs tabular-nums",
                          row.isOlaine ? "text-club-red" : "text-slate-600",
                        )}
                      >
                        {row.pos}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "py-2.5 pr-2 ",
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
                        <span className="truncate">{row.team}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-center font-mono text-sm tabular-nums text-slate-600">
                      {row.played}
                    </td>
                    <td className="py-2.5 text-center font-mono text-sm tabular-nums text-slate-600">
                      {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                    </td>
                    <td
                      className={cn(
                        "py-2.5 pr-1 text-center font-mono text-sm font-bold tabular-nums",
                        row.isOlaine ? "text-club-red" : "text-club-navy",
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
  );
}
