"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { TrainingFixtureCard } from "@/components/training-fixture-card";
import type { TrainingListItem } from "@/lib/trainings-server";

const FULL_MONTHS_LV = [
  "Janvāris",
  "Februāris",
  "Marts",
  "Aprīlis",
  "Maijs",
  "Jūnijs",
  "Jūlijs",
  "Augusts",
  "Septembris",
  "Oktobris",
  "Novembris",
  "Decembris",
];

const WEEKDAY_SHORT_LV = ["Pr", "Ot", "Tr", "Ce", "Pk", "Se", "Sv"];

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getAdjacentMonth(year: number, month: number, offset: number) {
  const date = new Date(Date.UTC(year, month + offset, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

type Cell = { day: number; year: number; month: number; muted: boolean };

export function TrainingsMonthCalendar({
  trainings,
  activeDateKey,
  onSelectDate,
  className,
}: {
  trainings: TrainingListItem[];
  /** The date currently shown in the desktop left-side list (see
   *  TrainingsDirectory) — highlighted here so the two stay visually linked. */
  activeDateKey?: string | null;
  /** Desktop (lg+): clicking a day reports it here instead of opening the
   *  mobile drawer, so TrainingsDirectory can show that day's trainings in
   *  its left column. */
  onSelectDate?: (dateKey: string) => void;
  /** Extra classes merged onto the root — lets callers override the default
   *  lg:rounded-b-none or stretch/match height elsewhere. */
  className?: string;
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const trainingsByDate = useMemo(() => {
    const map = new Map<string, TrainingListItem[]>();
    for (const training of trainings) {
      const list = map.get(training.rawDate) ?? [];
      list.push(training);
      map.set(training.rawDate, list);
    }
    return map;
  }, [trainings]);

  const todayKey = useMemo(() => {
    const now = new Date();
    return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const nextFixtureKey = useMemo(() => {
    const upcoming = trainings
      .filter((training) => !training.isPast)
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
    return upcoming[0]?.rawDate ?? null;
  }, [trainings]);

  const { year, month } = cursor;
  const firstWeekdayIndex = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const prevYM = getAdjacentMonth(year, month, -1);
  const nextYM = getAdjacentMonth(year, month, 1);
  const daysInPrevMonth = new Date(Date.UTC(prevYM.year, prevYM.month + 1, 0)).getUTCDate();

  const leading: Cell[] = Array.from({ length: firstWeekdayIndex }, (_, i) => ({
    day: daysInPrevMonth - firstWeekdayIndex + 1 + i,
    year: prevYM.year,
    month: prevYM.month,
    muted: true,
  }));
  const current: Cell[] = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    year,
    month,
    muted: false,
  }));
  const trailingCount = (7 - ((leading.length + current.length) % 7)) % 7;
  const trailing: Cell[] = Array.from({ length: trailingCount }, (_, i) => ({
    day: i + 1,
    year: nextYM.year,
    month: nextYM.month,
    muted: true,
  }));
  const cells: Cell[] = [...leading, ...current, ...trailing];

  function goToMonth(direction: -1 | 1) {
    setCursor((current) => {
      const next = new Date(Date.UTC(current.year, current.month + direction, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });
  }

  const selectedTrainings = selectedDateKey ? (trainingsByDate.get(selectedDateKey) ?? []) : [];

  return (
    <div
      className={cn(
        "ml-[calc(50%-50vw)] w-screen rounded-2xl bg-club-navy pt-6 pr-4 pb-4 pl-6 text-white sm:ml-0 sm:w-full sm:pt-8 sm:pr-5 sm:pb-5 sm:pl-8 lg:rounded-b-none",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-3xl tracking-[-0.02em] sm:text-4xl">{FULL_MONTHS_LV[month]}</h3>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            aria-label="Iepriekšējais mēnesis"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-white transition hover:border-white/30 hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            aria-label="Nākamais mēnesis"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-white transition hover:border-white/30 hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-x-1 text-center text-sm font-semibold text-white/40 uppercase sm:gap-x-2 sm:text-xs">
        {WEEKDAY_SHORT_LV.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-x-1 gap-y-2 sm:gap-x-2 sm:gap-y-3">
        {cells.map((cell, index) => {
          const dateKey = toDateKey(cell.year, cell.month, cell.day);
          const dayTrainings = cell.muted ? [] : (trainingsByDate.get(dateKey) ?? []);
          const hasTrainings = dayTrainings.length > 0;
          const isNextFixture = !cell.muted && dateKey === nextFixtureKey;
          const isToday = !cell.muted && dateKey === todayKey;
          const isActive = !cell.muted && dateKey === activeDateKey;
          const showDot = hasTrainings && !isNextFixture;

          const number = (
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold transition sm:h-11 sm:w-11 sm:text-xl",
                cell.muted && "text-white/20",
                !cell.muted && !isNextFixture && !isToday && "text-white",
                isToday && !isNextFixture && "bg-club-navy-light/70 text-white",
                isNextFixture && "bg-club-red text-white",
                isActive && "ring-2 ring-white ring-offset-2 ring-offset-club-navy",
              )}
            >
              {cell.day}
            </span>
          );

          const dot = (
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                showDot ? "bg-club-red" : "bg-transparent",
              )}
            />
          );

          if (cell.muted || !hasTrainings) {
            return (
              <div
                key={`${cell.year}-${cell.month}-${index}`}
                className="flex flex-col items-center justify-start gap-1.5 py-1"
              >
                {number}
                {dot}
              </div>
            );
          }

          return (
            <button
              key={`${cell.year}-${cell.month}-${index}`}
              type="button"
              onClick={() => {
                if (onSelectDate && window.matchMedia("(min-width: 1024px)").matches) {
                  onSelectDate(dateKey);
                  return;
                }
                setSelectedDateKey(dateKey);
                setDrawerOpen(true);
              }}
              className="flex flex-col items-center justify-start gap-1.5 rounded-lg py-1 transition hover:bg-white/5"
            >
              {number}
              {dot}
            </button>
          );
        })}
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="border-none bg-transparent shadow-none">
          <div className="mx-auto w-full max-w-sm rounded-t-2xl border border-border bg-white p-5 text-club-navy shadow-xl">
            {selectedTrainings.length === 0 ? (
              <p className="text-sm text-slate-400">Šajā dienā nav ieplānotu treniņu.</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
                {selectedTrainings.map((training) => (
                  <TrainingFixtureCard key={training.id} training={training} dimPast={false} />
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
