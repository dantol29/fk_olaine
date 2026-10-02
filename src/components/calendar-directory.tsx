"use client";

import { CalendarDays, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { useState } from "react";

import type { CalendarEvent } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { MatchListCard } from "@/components/upcoming-matches";
import { TrainingRow } from "@/components/trainings-directory";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

const FILTERS = [
  { key: "all", label: "Visi" },
  { key: "game", label: "Spēles" },
  { key: "training", label: "Treniņi" },
  { key: "other", label: "Pasākumi" },
] as const;
const WEEKDAYS = ["Pr", "Ot", "Tr", "Ce", "Pk", "Se", "Sv"];
const accent = { game: "bg-club-red", training: "bg-black", other: "bg-black/35" };

function monthOffset(month: string, offset: number) {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number - 1 + offset, 1)).toISOString().slice(0, 7);
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("lv-LV", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Riga" }).format(new Date(`${date}T12:00:00Z`));
}

export function CalendarDirectory({ events, today, minMonth, maxMonth }: { events: CalendarEvent[]; today: string; minMonth: string; maxMonth: string }) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [team, setTeam] = useState("Visas komandas");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const teams = ["Visas komandas", ...new Set(events.flatMap((event) => event.team ? [event.team] : []))];
  const visible = events.filter((event) => (team === "Visas komandas" || event.team === team || event.team === null) && (filter === "all" || filter === event.eventType));
  const byDate = new Map<string, CalendarEvent[]>();
  for (const event of visible) byDate.set(event.dateKey, [...(byDate.get(event.dateKey) ?? []), event]);
  const [year, number] = month.split("-").map(Number);
  const offset = (new Date(Date.UTC(year, number - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, index) => {
    const date = new Date(Date.UTC(year, number - 1, index - offset + 1));
    return { key: date.toISOString().slice(0, 10), day: date.getUTCDate(), muted: date.getUTCMonth() !== number - 1 };
  });
  const selectedEvents = selectedDate ? byDate.get(selectedDate) ?? [] : [];
  const monthEvents = visible.filter((event) => event.dateKey.startsWith(month));
  const controlClass = "flex size-11 items-center justify-center border-2 border-black hover:bg-black hover:text-white disabled:cursor-default disabled:opacity-25 disabled:hover:bg-white disabled:hover:text-black";

  return <>
    <section className="calendar-page-hero bg-black px-6 pt-6 text-white sm:px-10 sm:pt-8 lg:px-14">
      <div className="mx-auto max-w-[1920px]">
        <h1 className="mb-4 text-5xl leading-tight font-semibold uppercase sm:text-6xl lg:text-7xl">Kalendārs</h1>
        <nav aria-label="Komandas" className="flex gap-6 overflow-x-auto sm:gap-8">{teams.map((name) => <button key={name} type="button" aria-pressed={name === team} onClick={() => { setTeam(name); setSelectedDate(null); }} className={cn("shrink-0 border-b-4 pt-3 pb-1 text-base uppercase sm:text-lg", name === team ? "border-white font-semibold" : "border-transparent")}>{name}</button>)}</nav>
      </div>
    </section>
    <section className="px-6 py-10 text-black sm:px-10 sm:py-12 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <div aria-label="Notikumu veids" className="mx-auto mb-10 flex w-fit max-w-full border-b border-black/10">{FILTERS.map((item) => <button key={item.key} type="button" aria-pressed={filter === item.key} onClick={() => setFilter(item.key)} className={cn("border-b-4 px-3 pt-3 pb-1 text-xs font-semibold uppercase sm:px-7 sm:text-lg", filter === item.key ? "border-black" : "border-transparent text-black/40")}>{item.label}</button>)}</div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold uppercase sm:text-3xl">{new Intl.DateTimeFormat("lv-LV", { month: "long", year: "numeric", timeZone: "Europe/Riga" }).format(new Date(`${month}-15T12:00:00Z`))}</h2>
          <div className="flex items-center gap-3"><button type="button" onClick={() => setMonth(today.slice(0, 7))} className="min-h-11 border-2 border-black px-4 text-xs font-semibold uppercase hover:bg-black hover:text-white">Šodien</button><button type="button" aria-label="Iepriekšējais mēnesis" disabled={month <= minMonth} onClick={() => setMonth(monthOffset(month, -1))} className={controlClass}><ChevronLeft className="size-5" /></button><button type="button" aria-label="Nākamais mēnesis" disabled={month >= maxMonth} onClick={() => setMonth(monthOffset(month, 1))} className={controlClass}><ChevronRight className="size-5" /></button></div>
        </div>
        <div className="grid grid-cols-7 border-x border-t border-black/10 bg-black text-white">{WEEKDAYS.map((day) => <span key={day} className="py-3 text-center text-xs font-semibold uppercase sm:text-sm">{day}</span>)}</div>
        <div className="grid grid-cols-7 border-t border-l border-black/10">
          {cells.map((cell) => {
            const dayEvents = byDate.get(cell.key) ?? [];
            return <button key={cell.key} type="button" disabled={cell.muted} aria-label={`${dateLabel(cell.key)}, ${dayEvents.length} notikumi`} aria-pressed={selectedDate === cell.key} onClick={() => { setSelectedDate(cell.key); setOpen(true); }} className={cn("flex min-h-20 min-w-0 flex-col items-center border-r border-b border-black/10 p-2 text-left sm:min-h-36 sm:items-start sm:p-3 lg:min-h-44", cell.muted ? "bg-[#fafafa] text-black/20" : "hover:bg-[#f5f5f5]")}>
              <span className={cn("flex size-8 shrink-0 items-center justify-center text-sm font-semibold", selectedDate === cell.key ? "bg-club-red text-white" : cell.key === today && "bg-black text-white")}>{cell.day}</span>
              {!cell.muted && <><span className="mt-2 flex gap-1 sm:hidden">{[...new Set(dayEvents.map((event) => event.eventType))].map((type) => <span key={type} className={cn("size-1.5 rounded-full", accent[type])} />)}</span><span className="mt-2 hidden w-full space-y-2 sm:block">{dayEvents.slice(0, 2).map((event) => <span key={event.uid} className="block border-l-2 border-black/15 pl-2"><span className="flex items-center gap-1.5 text-xs font-semibold"><span className={cn("size-1.5 shrink-0 rounded-full", accent[event.eventType])} />{event.timeLabel ?? "Visa diena"}</span><span className="mt-1 block line-clamp-2 text-xs leading-snug text-black/65">{event.title}</span></span>)}{dayEvents.length > 2 && <span className="block text-xs font-semibold">+{dayEvents.length - 2} vēl</span>}</span></>}
            </button>;
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-5 text-xs text-black/60">{FILTERS.filter((item) => item.key !== "all").map((item) => <span key={item.key} className="flex items-center gap-2"><span className={cn("size-2 rounded-full", accent[item.key as CalendarEvent["eventType"]])} />{item.label}</span>)}</div>
        {!monthEvents.length && <p className="mt-8 border border-black/10 px-6 py-8 text-center text-sm text-black/50">Šajā mēnesī nav notikumu ar izvēlētajiem filtriem.</p>}
      </div>
    </section>
    <Drawer swipeDirection="right" open={open} onOpenChange={setOpen}>
      <DrawerContent className="!h-dvh !max-h-dvh !w-[min(100vw,520px)] border-none bg-white data-[swipe-direction=right]:rounded-none motion-reduce:transition-none" overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 bg-black px-6 py-4 text-white"><DrawerTitle className="text-xl text-white">{selectedDate ? dateLabel(selectedDate) : "Kalendārs"}</DrawerTitle><DrawerClose aria-label="Aizvērt" className="flex size-11 shrink-0 items-center justify-center"><X className="size-6" /></DrawerClose></div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6 text-black">
          {selectedEvents.length ? selectedEvents.map((event) => <div key={event.uid}><p className="mb-2 text-xs font-semibold text-black/45 uppercase">{FILTERS.find((item) => item.key === event.eventType)?.label}</p>{event.gameFixture ? <MatchListCard game={event.gameFixture} completed={new Date(event.start).getTime() <= Date.now()} compact /> : event.trainingFixture ? <TrainingRow training={event.trainingFixture} compact /> : <article className="border border-black/10 p-5"><p className="text-sm text-black/50">{event.timeLabel ?? "Visa diena"}</p><h3 className="mt-2 text-lg font-semibold">{event.title}</h3>{event.location && <p className="mt-3 flex items-start gap-2 text-sm text-black/50"><MapPin className="size-4 shrink-0" aria-hidden="true" />{event.location}</p>}</article>}</div>) : <div className="py-12 text-center"><CalendarDays className="mx-auto mb-4 size-10 text-black/25" aria-hidden="true" /><p className="text-sm text-black/50">Šajā dienā nav ieplānotu notikumu.</p></div>}
        </div>
      </DrawerContent>
    </Drawer>
  </>;
}
