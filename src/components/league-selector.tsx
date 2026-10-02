"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { StandingRow } from "@/lib/standings";

type LeagueSelectorProps = {
  leagues: { label: string; standings: StandingRow[]; url: string }[];
  /** Drops the "Spēles" column for narrower layouts (e.g. the
   *  /speles page, where this sits in a slimmer sidebar column). */
  compact?: boolean;
  /** Squares off the left corners on desktop (lg+), where this card sits
   *  flush against another card to its left with no gap (e.g. the
   *  homepage hero's news carousel). */
  flushLeft?: boolean;
  /** Dark translucent treatment used when the table floats over a photo. */
  overlay?: boolean;
  /** Solid, compact standings column inside the homepage hero. */
  hero?: boolean;
};

export function LeagueSelector({ leagues, compact = false, flushLeft = false, overlay = false, hero = false }: LeagueSelectorProps) {
  const [activeLeague, setActiveLeague] = useState(0);
  const leagueTabsContainerRef = useRef<HTMLDivElement>(null);
  const leagueTabsMeasureRef = useRef<HTMLDivElement>(null);
  const [leagueStart, setLeagueStart] = useState(0);
  const [visibleLeagueCount, setVisibleLeagueCount] = useState(leagues.length);

  const standings = leagues[activeLeague]?.standings ?? [];
  const activeLabel = leagues[activeLeague]?.label ?? "";
  const dense = overlay || hero;

  useLayoutEffect(() => {
    const container = leagueTabsContainerRef.current;
    const measure = leagueTabsMeasureRef.current;
    if (!container || !measure) return;

    const updateVisibleCount = () => {
      const arrowWidth = hero ? 52 : 40;
      const reservedArrowWidth = arrowWidth + (leagueStart > 0 ? arrowWidth : 0);
      const availableWidth = Math.max(0, container.clientWidth - reservedArrowWidth);
      const widths = Array.from(measure.children, (child) =>
        child.getBoundingClientRect().width,
      );
      let usedWidth = 0;
      let count = 0;
      for (let index = leagueStart; index < widths.length; index += 1) {
        const nextWidth = widths[index] + (count > 0 ? 8 : 0);
        if (usedWidth + nextWidth > availableWidth) break;
        usedWidth += nextWidth;
        count += 1;
      }
      setVisibleLeagueCount(Math.max(1, count));
    };

    updateVisibleCount();
    const observer = new ResizeObserver(updateVisibleCount);
    observer.observe(container);
    Array.from(measure.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [hero, leagueStart, leagues]);

  const leagueNavigation = (
    <div className={cn("relative w-[calc(100vw-1.5rem)] max-w-none sm:w-full sm:max-w-full", hero && "w-full max-w-full")}>
      <div
        ref={leagueTabsMeasureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute flex w-max gap-2"
      >
        {leagues.map((league) => (
          <span
            key={`measure-${league.label}`}
            className={cn("flex shrink-0 items-center gap-2 rounded-[1rem] px-4 py-2.5 text-xs font-semibold uppercase sm:px-5 sm:py-3 sm:text-sm", dense && "px-3 py-2 sm:px-4 sm:py-2", hero && "min-h-11 rounded-md sm:text-xs")}
          >
            {league.label}
          </span>
        ))}
      </div>
      <div
        ref={leagueTabsContainerRef}
        className="flex items-center gap-2"
      >
        {leagueStart > 0 && (
          <button
            type="button"
            aria-label="Iepriekšējās līgas"
            onClick={() =>
              setLeagueStart((start) => Math.max(0, start - visibleLeagueCount))
            }
            className={cn("flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-club-navy transition hover:bg-slate-200", hero && "size-11 rounded-md")}
          >
            <ArrowLeft className="size-4" />
          </button>
        )}
        <div className="flex min-w-0 flex-1 flex-nowrap gap-2 overflow-hidden pb-1">
          {leagues
            .slice(leagueStart, leagueStart + visibleLeagueCount)
            .map((league, offset) => {
              const index = leagueStart + offset;
              return (
                <button
                  key={league.label}
                  type="button"
                  onClick={() => setActiveLeague(index)}
                  aria-pressed={index === activeLeague}
                  title={league.label}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-[1rem] px-4 py-2.5 text-xs font-semibold uppercase transition sm:px-5 sm:py-3 sm:text-sm",
                    dense && "px-3 py-2 sm:px-4 sm:py-2",
                    hero && "min-h-11 max-w-full rounded-md sm:text-xs",
                    index === activeLeague
                      ? overlay
                        ? "bg-club-red/10 text-club-red"
                        : "bg-club-red text-white"
                      : overlay
                        ? "bg-slate-100 text-club-navy hover:bg-slate-200"
                        : "bg-slate-100 text-club-navy hover:bg-slate-200",
                  )}
                >
                  {hero ? <span className="min-w-0 truncate">{league.label}</span> : league.label}
                </button>
              );
            })}
        </div>
        <button
          type="button"
          aria-label="Nākamās līgas"
          disabled={leagueStart + visibleLeagueCount >= leagues.length}
          onClick={() =>
            setLeagueStart((start) =>
              Math.min(leagues.length - 1, start + visibleLeagueCount),
            )
          }
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-club-navy transition hover:bg-slate-200",
            overlay && "bg-slate-100 text-club-navy hover:bg-slate-200",
            hero && "size-11 rounded-md",
            leagueStart + visibleLeagueCount >= leagues.length && "invisible pointer-events-none",
          )}
        >
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={cn("flex h-auto flex-col lg:h-full", hero && "hero-standings min-h-0")}>
      <div
        className={cn(
          "relative flex flex-1 flex-col pt-6 pb-4 sm:overflow-hidden sm:rounded-[1.5rem] sm:bg-white sm:px-8 sm:pt-8 sm:pb-6",
          overlay && "rounded-2xl border border-white/70 bg-white/90 px-5 pt-5 pb-4 text-club-navy shadow-2xl shadow-black/20 backdrop-blur-xl sm:px-5 sm:pt-5 sm:pb-4",
          compact && "min-[1440px]:rounded-t-none",
          flushLeft && "min-[1600px]:!rounded-l-none",
          hero && "min-h-0 rounded-none bg-white px-5 py-6 sm:rounded-none sm:px-6 sm:py-8",
        )}
      >
        <div className={cn("mb-4 flex items-center justify-center gap-3 sm:mb-6 sm:justify-between", dense && "mb-3 sm:mb-4", hero && "items-start justify-between")}>
          <div className={cn("relative flex min-h-24 w-full min-w-0 flex-col items-center justify-center sm:min-h-0 sm:w-auto sm:items-start", hero && "min-h-0 w-auto items-start")}>
            <span
              aria-hidden
              className={cn("pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:hidden", hero && "hidden")}
            >
              {activeLabel}
            </span>
            <h3 className={cn("relative text-center text-3xl tracking-[-0.02em] text-club-navy sm:text-left sm:text-4xl", overlay && "sm:text-2xl", hero && "text-left text-2xl leading-tight font-bold sm:text-2xl")}>
              {leagues[activeLeague]?.label ?? (hero ? "Turnīra tabula" : "")}
            </h3>
          </div>
          <a
            href={leagues[activeLeague]?.url ?? "https://lff.lv/"}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 py-1.5 pr-1.5 pl-4 text-xs font-semibold text-club-navy transition hover:border-slate-300 sm:flex sm:gap-3 sm:pl-5 sm:text-sm", overlay && "border-slate-200 hover:border-slate-300", hero && "flex min-h-11 rounded-none border-0 p-0 text-xs hover:text-club-red sm:gap-2 sm:pl-0 sm:text-xs")}
          >
            Skatīt visas
            <span className={cn("flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 sm:h-8 sm:w-8", hero && "size-5 rounded-none bg-transparent sm:size-5")}>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </a>
        </div>

        {hero && <div className="mb-3 shrink-0">{leagueNavigation}</div>}

        <div
          tabIndex={hero ? 0 : undefined}
          role={hero ? "region" : undefined}
          aria-label={hero ? `${activeLabel || "Turnīra tabula"} — rezultāti` : undefined}
          className={cn("no-scrollbar overflow-visible lg:min-h-0 lg:flex-1 lg:overflow-y-auto", hero && "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-club-navy")}
        >
          {hero ? <HeroStandingsTable rows={standings} label={activeLabel} /> : <table className="w-full table-fixed border-collapse text-sm">
            {hero && <caption className="sr-only">{activeLabel || "Turnīra tabula"}: vieta, komanda, spēles un punkti</caption>}
            <colgroup>
              <col className="w-10 sm:w-12" />
              <col />
              {!compact && <col className={cn("hidden w-16 sm:table-column", hero && "sm:w-10")} />}
              <col className={cn("w-8 sm:w-16", hero && "sm:w-10")} />
            </colgroup>
            <thead className={hero ? "sticky top-0 z-10 bg-white" : undefined}>
              <tr className={cn("text-left text-xs text-slate-400", hero && "text-club-muted")}>
                <th colSpan={2} className="min-w-0 pb-3 pr-4 sm:pr-6">
                  {hero ? "Komanda" : leagueNavigation}
                </th>
                {!compact && (
                  <th className="hidden pb-3 text-center sm:table-cell sm:pr-0">
                    S
                  </th>
                )}
                <th className="pb-3 pr-1 text-center">
                  <span className={hero ? "inline" : "hidden sm:inline"}>P</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 ? (
                <tr>
                  <td
                    colSpan={compact ? 3 : 4}
                    className={cn("py-6 text-center text-sm text-slate-400", hero && "text-club-muted")}
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
                        "border-t border-slate-100",
                        overlay && "border-white/10", hero && row.isOlaine && "bg-club-red/5",
                      )}
                      style={{ animationDelay: `${enterDelay}ms` }}
                    >
                      <td
                        className={cn(
                          "py-4 pr-3 lg:pr-0 pl-0 sm:py-5",
                          dense && "py-2.5 sm:py-3",
                          row.isOlaine && "rounded-l-xl",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center font-mono text-lg font-bold tabular-nums",
                            dense && "h-6 w-6 text-base", hero && "font-sans",
                            row.isOlaine ? "text-club-red" : "text-slate-600",
                          )}
                        >
                          {row.pos}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "py-4 pr-2 sm:py-5",
                          dense && "py-2.5 sm:py-3",
                          row.isOlaine
                            ? "text-club-red font-semibold"
                            : "text-club-navy",
                        )}
                      >
                        <div className={cn("flex items-center gap-3", dense && "gap-2.5")}>
                          {row.logo && (
                            <Image
                              src={row.logo}
                              alt=""
                              width={48}
                              height={48}
                              className={cn("h-11 w-11 shrink-0 rounded-full bg-white object-contain ring-1 ring-black/5", dense && "h-9 w-9", hero && "h-8 w-8")}
                            />
                          )}
                          <span title={row.team} className={cn("truncate text-base uppercase font-semibold sm:text-sm", dense && "text-sm sm:text-xs")}>
                            {row.team}
                          </span>
                        </div>
                      </td>
                      {!compact && (
                        <td className={cn("hidden py-4 text-center font-mono text-sm tabular-nums text-slate-600 sm:table-cell sm:py-5 sm:pr-3", dense && "py-2.5 text-xs sm:py-3", hero && "font-sans")}>
                          {row.played}
                        </td>
                      )}
                      <td
                        className={cn(
                          "py-4 pr-2 text-center font-mono text-base font-bold tabular-nums sm:py-5",
                          dense && "py-2.5 sm:py-3",
                          hero && "font-sans",
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
          </table>}
        </div>
      </div>
    </div>
  );
}

function HeroStandingsTable({ rows, label }: { rows: StandingRow[]; label: string }) {
  return (
    <table className="hero-league-table w-full table-fixed border-collapse text-xs tabular-nums">
      <caption className="sr-only">{label}: komandu vietas, spēles, uzvaras, zaudējumi, vārtu starpība un punkti</caption>
      <colgroup>
        <col className="w-8" /><col />
        <col className="w-7 sm:w-8" /><col className="w-7 sm:w-8" /><col className="w-7 sm:w-8" />
        <col className="w-9 sm:w-10" /><col className="w-11 sm:w-14" />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">#</th><th scope="col" className="text-left">Komanda</th>
          <th scope="col" title="Spēles">S</th><th scope="col" title="Uzvaras">U</th>
          <th scope="col" title="Zaudējumi">P</th><th scope="col" title="Vārtu starpība">+/-</th>
          <th scope="col">Punkti</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? <tr><td colSpan={7} className="py-8 text-center">Tabula pašlaik nav pieejama.</td></tr> : rows.map((row) => (
          <tr key={row.pos} data-club={row.isOlaine || undefined}>
            <td className="text-center text-base font-bold">{row.pos}</td>
            <td>
              <div className="flex min-w-0 items-center gap-2">
                {row.logo && <Image src={row.logo} alt="" width={36} height={36} className="size-8 shrink-0 object-contain sm:size-9" />}
                <span title={row.team} className="min-w-0 truncate font-semibold uppercase">{row.team}</span>
              </div>
            </td>
            <td className="text-center">{row.played}</td><td className="text-center">{row.wins}</td>
            <td className="text-center">{row.losses}</td><td className="text-center">{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
            <td className="text-center text-base font-bold">{row.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
