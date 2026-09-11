"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const MONTHS = ["Janvāris", "Februāris", "Marts", "Aprīlis", "Maijs", "Jūnijs", "Jūlijs", "Augusts", "Septembris", "Oktobris", "Novembris", "Decembris"];
const WEEKDAYS = ["P", "O", "T", "C", "P", "S", "Sv"];

export function CalendarDatePicker({ value, onSelect }: {
  value: Date;
  onSelect: (date: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(value.getUTCMonth());
  const [year, setYear] = useState(String(value.getUTCFullYear()));
  const numericYear = Number(year);
  const validYear = /^\d{4}$/.test(year) && numericYear >= 100 && numericYear <= 9998;
  const firstDay = validYear ? new Date(Date.UTC(numericYear, month, 1)) : null;
  const offset = firstDay ? (firstDay.getUTCDay() + 6) % 7 : 0;
  const days = validYear ? new Date(Date.UTC(numericYear, month + 1, 0)).getUTCDate() : 0;

  function moveMonth(delta: number) {
    const date = new Date(Date.UTC(numericYear, month + delta, 1));
    if (date.getUTCFullYear() < 100 || date.getUTCFullYear() > 9998) return;
    setMonth(date.getUTCMonth());
    setYear(String(date.getUTCFullYear()).padStart(4, "0"));
  }

  const navClass = "flex size-9 shrink-0 items-center justify-center rounded-lg text-club-navy hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-club-red disabled:opacity-30";

  return (
    <Popover.Root open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (nextOpen) {
        setMonth(value.getUTCMonth());
        setYear(String(value.getUTCFullYear()).padStart(4, "0"));
      }
    }}>
      <Popover.Trigger aria-label="Izvēlēties datumu" className="flex size-11 shrink-0 items-center justify-center gap-2 rounded-full bg-slate-100 text-sm font-semibold text-club-navy transition-colors hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-club-red sm:h-10 sm:w-auto sm:px-4">
        <CalendarDays className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Izvēlēties datumu</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end" className="z-50">
          <Popover.Popup className="w-[320px] max-w-[calc(100vw-32px)] rounded-2xl border border-slate-200 bg-white p-4 text-club-navy shadow-xl outline-none">
            <Popover.Title className="mb-3 text-sm font-semibold">Pāriet uz datumu</Popover.Title>
            <div className="mb-3 flex items-center gap-1">
              <button type="button" aria-label="Iepriekšējais mēnesis" disabled={!validYear} onClick={() => moveMonth(-1)} className={navClass}><ChevronLeft className="size-4" /></button>
              <select aria-label="Mēnesis" value={month} onChange={(event) => setMonth(Number(event.target.value))} className="h-9 min-w-0 flex-1 rounded-lg bg-slate-100 px-2 text-sm focus-visible:outline-2 focus-visible:outline-club-red">
                {MONTHS.map((label, index) => <option key={label} value={index}>{label}</option>)}
              </select>
              <input aria-label="Gads" type="text" inputMode="numeric" maxLength={4} value={year} onChange={(event) => setYear(event.target.value.replace(/\D/g, ""))} className="h-9 w-14 rounded-lg bg-slate-100 px-1 text-center text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-club-red" />
              <button type="button" aria-label="Nākamais mēnesis" disabled={!validYear} onClick={() => moveMonth(1)} className={navClass}><ChevronRight className="size-4" /></button>
            </div>
            <div className="grid grid-cols-7 text-center">
              {WEEKDAYS.map((label, index) => <span key={index} aria-hidden="true" className="py-2 text-xs text-slate-500">{label}</span>)}
              {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}
              {Array.from({ length: days }, (_, index) => {
                const day = index + 1;
                const selected = value.getUTCFullYear() === numericYear && value.getUTCMonth() === month && value.getUTCDate() === day;
                const date = new Date(Date.UTC(numericYear, month, day));
                return <button key={day} type="button" aria-pressed={selected} aria-label={date.toLocaleDateString("lv-LV", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" })} onClick={() => { onSelect(date); setOpen(false); }} className={cn("flex h-11 items-center justify-center rounded-lg text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-club-red", selected ? "bg-club-red font-semibold text-white" : "hover:bg-slate-100")}>
                  {day}
                </button>;
              })}
            </div>
            {!validYear && <p role="status" className="py-4 text-sm text-slate-500">Ievadiet četrciparu gadu (0100–9998).</p>}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
