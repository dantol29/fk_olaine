"use client";

import { MapPin } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { TrainingListItem } from "@/lib/trainings-server";

function TrainingRow({ training }: { training: TrainingListItem }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-5",
        training.isPast && "opacity-50",
      )}
    >
      <div className="flex w-10 shrink-0 flex-col items-start leading-none text-slate-600 sm:w-14">
        <span className="text-xl font-extrabold sm:text-3xl">{training.day}</span>
        <span className="mt-1 text-[10px] font-semibold text-slate-400 uppercase sm:text-xs">
          {training.month}
        </span>
      </div>

      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-club-navy uppercase sm:text-sm">
        {training.teamName}
      </span>

      <span className="shrink-0 text-base font-extrabold text-club-navy sm:text-lg">
        {training.startTime}–{training.endTime}
      </span>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-right text-xs text-slate-400 sm:text-sm">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 line-clamp-2 leading-tight">{training.location}</span>
      </div>
    </div>
  );
}

export function TrainingsDirectory({ trainings }: { trainings: TrainingListItem[] }) {
  const [activeTeam, setActiveTeam] = useState("Visas komandas");

  const teamNames = useMemo(
    () => ["Visas komandas", ...new Set(trainings.map((training) => training.teamName))],
    [trainings],
  );

  const visible = useMemo(() => {
    return trainings
      .filter((training) => !training.isPast)
      .filter((training) => activeTeam === "Visas komandas" || training.teamName === activeTeam)
      .sort((a, b) => `${a.rawDate}${a.startTime}`.localeCompare(`${b.rawDate}${b.startTime}`));
  }, [trainings, activeTeam]);

  return (
    <>
      <section className="px-6 pt-14 sm:pt-14">
        <div className="mx-auto max-w-[1440px]">
          <div className="relative flex min-h-24 flex-col justify-center sm:min-h-32">
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:text-8xl"
            >
              Treniņi
            </span>
            <h1 className="relative text-4xl tracking-[-0.02em] text-club-navy sm:text-5xl">
              Treniņi
            </h1>
          </div>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-8 flex flex-wrap gap-2">
            {teamNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setActiveTeam(name)}
                aria-pressed={activeTeam === name}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition",
                  activeTeam === name
                    ? "bg-club-navy text-white"
                    : "bg-slate-100 text-club-navy hover:bg-slate-200",
                )}
              >
                {name}
              </button>
            ))}
          </div>

          {visible.length > 0 ? (
            <div className="max-w-[820px] divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {visible.map((training) => (
                <TrainingRow key={training.id} training={training} />
              ))}
            </div>
          ) : (
            <div className="max-w-[820px] rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-400">
              Treniņi nav atrasti.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
