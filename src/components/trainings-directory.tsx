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
  return <article className="border border-black/10 bg-white text-black">
    <div className={cn("grid items-center", compact ? "grid-cols-[68px_minmax(0,1fr)] gap-4 p-4" : "grid-cols-[80px_minmax(0,1fr)] gap-5 p-5 sm:p-7 lg:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)] lg:gap-8")}>
      <div>
        <p className={cn("font-semibold tabular-nums", compact ? "text-lg" : "text-2xl")}>{training.startTime}</p>
        <p className={cn("mt-1 text-black/45", compact ? "text-xs" : "text-sm")}>līdz {training.endTime}</p>
        <p className={cn("mt-2 text-black/45", compact ? "text-xs" : "text-sm")}>{Number(training.day)}. {training.month.toLowerCase()}</p>
      </div>
      <div className="min-w-0">
        <h3 className={cn("font-semibold uppercase", compact ? "text-base" : "text-lg sm:text-xl")}>{training.teamName}</h3>
        <p className="mt-2 flex items-start gap-2 text-sm text-black/50"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{training.location}</span></p>
      </div>
      {training.coaches.length > 0 && <div className={cn("flex min-w-0 items-center gap-3", compact ? "col-span-2 border-t border-black/10 pt-3" : "col-span-2 border-t border-black/10 pt-4 lg:col-span-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8")}>
        <CoachAvatars coaches={training.coaches} avatarClassName="size-9 text-xs" />
        <div className="min-w-0"><p className="text-xs text-black/45">Treneri</p><p className="mt-1 text-sm">{training.coaches.map((coach) => coach.name).join(", ")}</p></div>
      </div>}
    </div>
  </article>;
}

export function TrainingsDirectory({ trainings, birthdays }: { trainings: TrainingListItem[]; birthdays?: ReactNode }) {
  const [activeTeam, setActiveTeam] = useState("Visas komandas");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<string | null>(null);
  const teamNames = ["Visas komandas", ...new Set(trainings.map((training) => training.teamName))];
  const teamFiltered = trainings.filter((training) => activeTeam === "Visas komandas" || training.teamName === activeTeam);
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
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <nav aria-label="Komandas" className="flex min-w-0 gap-6 overflow-x-auto sm:gap-8">
            {teamNames.map((name) => <button key={name} type="button" aria-pressed={activeTeam === name} onClick={() => { setActiveTeam(name); setCalendarDate(null); }} className={cn("shrink-0 border-b-4 pt-3 pb-1 text-base uppercase sm:text-lg", activeTeam === name ? "border-white font-semibold" : "border-transparent")}>{name}</button>)}
          </nav>
          <div className="shrink-0 pb-1"><DrawerTrigger className="flex min-h-11 items-center justify-center gap-2 bg-white px-5 text-xs font-semibold text-black uppercase"><CalendarDays className="size-5" aria-hidden="true" />Skatīt kalendārā</DrawerTrigger></div>
        </div>
      </div>
    </section>
    <section className="bg-[#fafafa] px-6 pt-10 pb-16 text-black sm:px-10 sm:pt-12 lg:px-14">
      <div className="mx-auto max-w-[1920px]">
        {visible.length ? [...groups].map(([month, sessions]) => <section key={month} className="mb-10">
          <h2 className="mb-6 text-center text-lg font-semibold text-black/40 uppercase">{new Intl.DateTimeFormat("lv-LV", { month: "long", year: "numeric", timeZone: "Europe/Riga" }).format(new Date(`${month}-15T12:00:00Z`))}</h2>
          <div className="space-y-5">{sessions.map((training) => <TrainingRow key={training.id} training={training} />)}</div>
        </section>) : <div className="border border-black/10 bg-white px-6 py-16 text-center"><CalendarDays className="mx-auto mb-5 size-10 text-black/30" aria-hidden="true" /><h2 className="text-xl font-semibold">Gaidāmo treniņu pašlaik nav</h2><p className="mt-3 text-sm text-black/55">{activeTeam === "Visas komandas" ? "Treniņu grafiks tiks papildināts." : "Izvēlies citu komandu vai apskati iepriekšējos treniņus kalendārā."}</p></div>}
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
