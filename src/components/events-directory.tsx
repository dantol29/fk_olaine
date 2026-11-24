"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";

import { formatEventSpan } from "@/lib/events";

export type EventListItem = {
  id: number;
  title: string;
  date: string;
  endDate: string | null;
  startTime: string;
  endTime: string;
  location: string;
  teams: string[];
  path: string;
};

/** Past events shown at first, and added by each "Rādīt vairāk". */
const PAST_PAGE_SIZE = 12;

function EventRow({ event }: { event: EventListItem }) {
  return (
    <li>
      <Link href={event.path} className="group block rounded-3xl border border-white/10 bg-club-navy-light p-5 transition-colors hover:border-white/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:p-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-white/70 tabular-nums">
          <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
          {formatEventSpan(event.date, event.startTime, event.endDate, event.endTime)}
        </p>
        <h3 className="mt-3 text-2xl leading-tight font-semibold uppercase group-hover:underline sm:text-3xl">{event.title}</h3>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-sm text-white/70">
          <span className="flex min-w-0 items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{event.location}</span>
          {event.teams.length > 0 && <span className="font-medium text-white">{event.teams.join(", ")}</span>}
        </div>
      </Link>
    </li>
  );
}

/** Upcoming events nearest first, then past ones latest first, a page at a time. */
export function EventsDirectory({ upcoming, past }: { upcoming: EventListItem[]; past: EventListItem[] }) {
  const [shownPast, setShownPast] = useState(PAST_PAGE_SIZE);

  return (
    // Same width as the page title above and the other list pages (Spēles, Jaunumi).
    <div className="mx-auto max-w-[1920px]">
      <section aria-labelledby="upcoming-events">
        <h2 id="upcoming-events" className="text-3xl font-semibold uppercase sm:text-4xl">Gaidāmie</h2>
        {upcoming.length > 0 ? (
          <ul className="mt-6 grid gap-4">{upcoming.map((event) => <EventRow key={event.id} event={event} />)}</ul>
        ) : (
          <p className="mt-6 text-white/60">Pašlaik nav ieplānotu notikumu.</p>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-events" className="mt-14 sm:mt-20">
          <h2 id="past-events" className="text-3xl font-semibold uppercase sm:text-4xl">Aizvadītie</h2>
          <ul className="mt-6 grid gap-4">{past.slice(0, shownPast).map((event) => <EventRow key={event.id} event={event} />)}</ul>
          {past.length > shownPast && (
            <button type="button" onClick={() => setShownPast((count) => count + PAST_PAGE_SIZE)} className="motion-action mt-8 inline-flex min-h-11 items-center rounded-xl border border-white/30 px-5 text-sm font-semibold text-white hover:bg-white/10">
              Rādīt vairāk
            </button>
          )}
        </section>
      )}
    </div>
  );
}
