"use client";

import { CalendarDays, MapPin, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { TrainingListItem } from "@/lib/trainings-server";
import { CoachAvatars } from "@/components/training-fixture-card";
import { TrainingsMonthCalendar } from "@/components/trainings-month-calendar";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

export function TrainingRow({ training, compact = false }: { training: TrainingListItem; compact?: boolean }) {
  return <article className="border border-black/15 bg-white text-black">
    <div className={cn("grid gap-5", compact ? "p-4" : "p-5 sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-8 sm:p-7")}>
      <div className={cn("flex items-center justify-between gap-4", !compact && "sm:block sm:border-r sm:border-black/15 sm:pr-6")}>
        <div className="flex items-baseline gap-2 sm:block">
          <p className="text-4xl leading-none font-semibold tabular-nums">{Number(training.day)}</p>
          <p className="text-sm text-black/55 uppercase sm:mt-2">{training.month.toLowerCase()}</p>
        </div>
        <p className={cn("shrink-0 text-lg font-semibold tabular-nums", !compact && "sm:hidden")}>{training.startTime}–{training.endTime}</p>
      </div>
      <div className="min-w-0">
        {!compact && <p className="mb-3 hidden text-2xl font-semibold tabular-nums sm:block">{training.startTime}–{training.endTime}</p>}
        <p className="flex items-start gap-2 text-lg leading-snug font-medium"><MapPin className="mt-1 size-4 shrink-0 text-black/45" aria-hidden="true" /><span>{training.location}</span></p>
      </div>
    </div>
    {training.coaches.length > 0 && <div className={cn("flex items-center gap-3 border-t border-black/10 bg-[#f7f7f7] py-3", compact ? "px-4" : "px-5 sm:px-7")}>
      <CoachAvatars coaches={training.coaches} avatarClassName="size-8 text-xs" />
      <div className="min-w-0"><p className="text-[11px] text-black/45 uppercase">Treneri</p><p className="mt-0.5 text-sm leading-snug">{training.coaches.map((coach) => coach.name).join(", ")}</p></div>
    </div>}
  </article>;
}

export function TrainingsDirectory({ trainings, birthdays, teams }: { trainings: TrainingListItem[]; birthdays?: ReactNode; teams: { id: number; name: string }[] }) {
  const teamNames = teams.map((team) => team.name);
  const [activeTeam, setActiveTeam] = useState(teamNames[0] ?? "");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<string | null>(null);
  const teamFiltered = trainings.filter((training) => training.teamName === activeTeam);
  const visible = teamFiltered.filter((training) => !training.isPast).sort((a, b) => `${a.rawDate}${a.startTime}`.localeCompare(`${b.rawDate}${b.startTime}`));
  const selectedTrainings = teamFiltered.filter((training) => training.rawDate === calendarDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const groups = new Map<string, TrainingListItem[]>();
  for (const training of visible) {
    const month = training.rawDate.slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), training]);
  }

  return <Drawer swipeDirection="right" open={calendarOpen} onOpenChange={setCalendarOpen}>
    <section className="trainings-page-hero bg-black px-6 pt-6 text-white sm:px-10 sm:pt-8 lg:px-14">
      <div className="mx-auto max-w-[1920px]">
        <h1 className="mb-2 text-5xl leading-tight font-semibold uppercase sm:text-6xl lg:text-7xl">Treniņi</h1>
        <div className="flex flex-col justify-between lg:flex-row lg:items-end lg:gap-3">
          <nav aria-label="Komandas" className="flex min-w-0 gap-6 overflow-x-auto sm:gap-8">
            {teamNames.map((name) => <button key={name} type="button" aria-pressed={activeTeam === name} onClick={() => { setActiveTeam(name); setCalendarDate(null); }} className={cn("relative shrink-0 pt-3 pb-2 text-base uppercase sm:text-lg", activeTeam === name && "font-semibold after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-white")}>{name}</button>)}
          </nav>
          <div className="-mx-6 flex shrink-0 justify-end bg-white px-6 py-2 sm:-mx-10 sm:px-10 lg:mx-0 lg:bg-transparent lg:px-0 lg:pt-0 lg:pb-1"><DrawerTrigger className="flex min-h-11 items-center justify-center gap-2 bg-club-red px-5 text-xs font-semibold text-white uppercase lg:bg-white lg:text-black"><CalendarDays className="size-5" aria-hidden="true" />Skatīt kalendārā</DrawerTrigger></div>
        </div>
      </div>
    </section>
    <section className="bg-[#fafafa] px-6 pt-10 pb-16 text-black sm:px-10 sm:pt-12 lg:px-14">
      <div className="mx-auto max-w-[1920px]">
        {visible.length ? [...groups].map(([month, sessions]) => <section key={month} className="mb-10">
          <h2 className="mb-6 text-center text-lg font-semibold text-black/40 uppercase">{new Intl.DateTimeFormat("lv-LV", { month: "long", year: "numeric", timeZone: "Europe/Riga" }).format(new Date(`${month}-15T12:00:00Z`))}</h2>
          <div className="space-y-5">{sessions.map((training) => <TrainingRow key={training.id} training={training} />)}</div>
        </section>) : <div className="border border-black/10 bg-white px-6 py-16 text-center"><CalendarDays className="mx-auto mb-5 size-10 text-black/30" aria-hidden="true" /><h2 className="text-xl font-semibold">Gaidāmo treniņu pašlaik nav</h2><p className="mt-3 text-sm text-black/55">{teamNames.length === 0 ? "Treniņu grafiks tiks papildināts." : "Izvēlies citu komandu vai apskati iepriekšējos treniņus kalendārā."}</p></div>}
        {birthdays && <div className="mx-auto mt-16 max-w-[1280px] border-t border-black/10 pt-10">{birthdays}</div>}
      </div>
    </section>
    <DrawerContent className="!h-dvh !max-h-dvh !w-[min(100vw,520px)] border-none bg-white shadow-xl data-[swipe-direction=right]:rounded-none motion-reduce:transition-none" overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-sm">
      <div className="flex items-center justify-between bg-black px-6 py-4 text-white"><div><DrawerTitle className="text-2xl text-white">Treniņu kalendārs</DrawerTitle><p className="mt-1 text-sm text-white/60">{activeTeam}</p></div><DrawerClose aria-label="Aizvērt kalendāru" className="flex size-11 items-center justify-center"><X className="size-6" /></DrawerClose></div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <TrainingsMonthCalendar trainings={teamFiltered} activeDateKey={calendarDate} onSelectDate={setCalendarDate} className="!ml-0 !w-full !rounded-none !bg-black" />
        <div className="p-6">{calendarDate ? <div className="space-y-5">{selectedTrainings.map((training) => <TrainingRow key={training.id} training={training} compact />)}</div> : <p className="text-sm text-black/60">Izvēlies atzīmēto datumu, lai skatītu treniņu informāciju.</p>}</div>
      </div>
    </DrawerContent>
  </Drawer>;
}
