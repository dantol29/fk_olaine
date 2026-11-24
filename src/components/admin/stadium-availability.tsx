"use client";

import { AdminLink } from "@/components/admin/admin-link";
import { useEffect, useRef, useState } from "react";

type Booking = { uid: string; title: string; start: string; end: string };
type Result = { events: Booking[] };
const clock = new Intl.DateTimeFormat("lv-LV", { timeZone: "Europe/Riga", hour: "2-digit", minute: "2-digit" });
const dayMonth = new Intl.DateTimeFormat("lv-LV", { timeZone: "Europe/Riga", day: "2-digit", month: "2-digit" });
/** "17:00–18:30" when one day is checked; "13.12. 17:00–18:30" when the form covers several days. */
function bookingTime(booking: Booking, withDay: boolean) {
  const start = new Date(booking.start);
  const time = `${clock.format(start)}–${clock.format(new Date(booking.end))}`;
  return withDay ? `${dayMonth.format(start)} ${time}` : time;
}
function wallTime(date: string, time: string) {
  const guess = new Date(`${date}T${time}:00Z`);
  if (!Number.isFinite(guess.getTime())) return NaN;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Riga", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(guess);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const local = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return guess.getTime() - (local - guess.getTime());
}

export function StadiumAvailability({ exclude }: { exclude?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const requestKey = useRef("");
  const [input, setInput] = useState({ date: "", endDate: "", start: "", end: "", location: "" });
  const [result, setResult] = useState<Result | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const update = () => {
      const data = new FormData(form);
      // "endDate" is only in the form while "Vairākas dienas" is ticked.
      const next = { date: String(data.get("date") ?? ""), endDate: String(data.get("endDate") ?? ""), start: String(data.get("startTime") ?? ""), end: String(data.get("endTime") ?? ""), location: String(data.get("location") || data.get("customLocation") || "") };
      const key = `${next.date}::${next.endDate}::${next.location}`;
      if (requestKey.current !== key) { requestKey.current = key; setResult(null); setStatus("idle"); }
      setInput(next);
    };
    update(); form.addEventListener("input", update); form.addEventListener("change", update);
    return () => { form.removeEventListener("input", update); form.removeEventListener("change", update); };
  }, []);
  useEffect(() => {
    if (!input.date || !input.location.trim() || (input.endDate && input.endDate < input.date)) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const params = new URLSearchParams({ date: input.date, ...(input.endDate ? { endDate: input.endDate } : {}), location: input.location, ...(exclude ? { exclude } : {}) });
        const response = await fetch(`/api/admin/stadium-availability?${params}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Unavailable");
        const data: Result = await response.json();
        if (!controller.signal.aborted) { setResult(data); setStatus("ok"); }
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [input.date, input.endDate, input.location, exclude]);
  const start = input.start ? wallTime(input.date, input.start) : NaN;
  // A multi-day event ends at its end time on its last day.
  const multiDay = Boolean(input.endDate) && input.endDate > input.date;
  const end = input.end ? wallTime(multiDay ? input.endDate : input.date, input.end) : NaN;
  const clashes = result?.events.filter((event) => start < new Date(event.end).getTime() && new Date(event.start).getTime() < end) ?? [];
  return <div ref={ref} className="mt-5 border border-black/15 bg-white p-4 text-sm" aria-live="polite">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Vietas noslodze</h2><AdminLink href="/admin/calendar" target="_blank" rel="noopener noreferrer" className="underline">Atvērt kalendāru</AdminLink></div>
    <p className="mt-2 text-black/55">Tiek pārbaudītas tikai FK Olaine rezervācijas.</p>
    {!input.date || !input.location.trim() ? <p className="mt-2 text-black/55">Izvēlies datumu un vietu, lai pārbaudītu rezervācijas.</p> : status === "loading" || status === "idle" ? <p className="mt-2 text-black/55">Pārbauda rezervācijas…</p> : status === "error" ? <p className="mt-2 text-amber-800">Pieejamību nevar pārbaudīt. Pārbaudi kalendāru pirms saglabāšanas.</p> : <>
      {input.start && input.end && end <= start && <p className="mt-2 text-club-red">Beigu laikam jābūt pēc sākuma laika.</p>}
      {clashes.length > 0 && <p className="mt-2 font-semibold text-club-red">Izvēlētais laiks pārklājas ar {clashes.length} rezervāciju(-ām).</p>}
      {result?.events.length ? <ul className="mt-3 space-y-3">{result.events.map((event) => <li key={event.uid} className={clashes.some((item) => item.uid === event.uid) ? "border-l-2 border-club-red pl-3" : "border-l-2 border-black/15 pl-3"}><p className="font-semibold">{bookingTime(event, multiDay)}</p><p className="mt-1 text-black/60">{event.title}</p></li>)}</ul> : <p className="mt-2 text-black/55">Šajā vietā nav reģistrētu FK Olaine rezervāciju.</p>}
    </>}
  </div>;
}
