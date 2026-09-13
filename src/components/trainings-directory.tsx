"use client";

import { MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { TrainingListItem } from "@/lib/trainings-server";
import { CoachAvatars, TrainingFixtureCard } from "@/components/training-fixture-card";
import { TrainingsMonthCalendar } from "@/components/trainings-month-calendar";

function TrainingRow({ training }: { training: TrainingListItem }) {
  return (
    <>
      {/* Mobile: a single horizontal line doesn't leave enough room for
       *  team + time + location + coaches, so it stacks instead. */}
      <div className="sm:hidden">
        <TrainingFixtureCard training={training} />
      </div>

      {/* sm and up: single horizontal fixture line. */}
      <div
        className={cn(
          "relative hidden items-center gap-8 py-7 sm:flex",
          training.isPast && "opacity-50",
        )}
      >
        <div className="flex w-16 shrink-0 flex-col items-start leading-none text-slate-600">
          <span className="text-4xl font-extrabold">{training.day}</span>
          <span className="mt-1 text-sm font-semibold text-slate-400 uppercase">{training.month}</span>
        </div>

        {training.coaches.length > 0 && (
          <div className="flex min-w-0 items-center gap-2">
            <CoachAvatars coaches={training.coaches} avatarClassName="h-8 w-8 text-xs" />
            <span className="hidden max-w-[220px] min-w-0 text-base leading-tight text-slate-400 sm:line-clamp-2">
              {training.coaches.map((coach) => coach.name).join(", ")}
            </span>
          </div>
        )}

        <span className="absolute left-1/2 -translate-x-1/2 text-center text-3xl font-extrabold text-club-navy">
          {training.startTime} – {training.endTime}
        </span>

        <div className="ml-auto flex min-w-0 w-64 shrink-0 flex-col items-end gap-1.5">
          <div className="flex min-w-0 items-center gap-2 text-right text-base text-slate-400">
            <MapPin className="h-5 w-5 shrink-0" />
            <span className="min-w-0 line-clamp-2 leading-tight">{training.location}</span>
          </div>

          <span className="w-fit max-w-full truncate rounded-full bg-slate-100 px-4 py-2 text-sm text-club-navy">
            {training.teamName}
          </span>
        </div>
      </div>
    </>
  );
}

export function TrainingsDirectory({
  trainings,
  birthdays,
}: {
  trainings: TrainingListItem[];
  birthdays?: ReactNode;
}) {
  const [activeTeam, setActiveTeam] = useState("Visas komandas");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const teamNames = useMemo(
    () => ["Visas komandas", ...new Set(trainings.map((training) => training.teamName))],
    [trainings],
  );

  function handleTeamChange(name: string) {
    setActiveTeam(name);
    setSelectedDateKey(null);
  }

  const teamFiltered = useMemo(() => {
    return trainings.filter(
      (training) => activeTeam === "Visas komandas" || training.teamName === activeTeam,
    );
  }, [trainings, activeTeam]);

  const visible = useMemo(() => {
    return teamFiltered
      .filter((training) => !training.isPast)
      .sort((a, b) => `${a.rawDate}${a.startTime}`.localeCompare(`${b.rawDate}${b.startTime}`));
  }, [teamFiltered]);

  const selectedDateTrainings = useMemo(() => {
    if (!selectedDateKey) return [];
    return teamFiltered
      .filter((training) => training.rawDate === selectedDateKey)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [teamFiltered, selectedDateKey]);

  const listTrainings = selectedDateKey ? selectedDateTrainings : visible;

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
                onClick={() => handleTeamChange(name)}
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

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[980px_1fr]">
            <div className="hidden flex-col gap-4 lg:flex">
              {selectedDateKey && (
                <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-5 py-3">
                  <span className="text-sm font-semibold text-club-navy">
                    {listTrainings[0]
                      ? `${listTrainings[0].day}. ${listTrainings[0].month}`
                      : "Šī diena"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDateKey(null)}
                    className="text-sm font-semibold text-club-red hover:underline"
                  >
                    Rādīt visus treniņus
                  </button>
                </div>
              )}

              {listTrainings.length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-2xl bg-white px-6">
                  {listTrainings.map((training) => (
                    <TrainingRow key={training.id} training={training} />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400">
                  {selectedDateKey ? "Šajā dienā treniņu nav." : "Treniņi nav atrasti."}
                </div>
              )}
            </div>

            <div className="lg:hidden">
              {visible.length > 0 ? (
                <div className="divide-y divide-slate-100 sm:rounded-2xl sm:bg-white sm:px-6">
                  {visible.map((training) => (
                    <TrainingRow key={training.id} training={training} />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400">
                  Treniņi nav atrasti.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6 lg:gap-0">
              <TrainingsMonthCalendar
                trainings={teamFiltered}
                activeDateKey={selectedDateKey}
                onSelectDate={setSelectedDateKey}
              />
              {birthdays}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
