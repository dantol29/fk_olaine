import type { Metadata } from "next";

import { EventsDirectory, type EventListItem } from "@/components/events-directory";
import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { toDateKey } from "@/lib/calendar";
import { getPublicEvents } from "@/lib/events-server";

export const metadata: Metadata = {
  title: "Notikumi",
  description: "FK Olaine notikumi — turnīri, nometnes un kluba pasākumi.",
  alternates: { canonical: "/notikumi" },
};

// "Upcoming" and "past" move with the date, so the page is rebuilt at least hourly.
export const revalidate = 3600;

export default async function EventsPage() {
  const today = toDateKey(new Date());
  const events: EventListItem[] = (await getPublicEvents()).map((event) => ({
    id: event.id,
    title: event.title,
    date: event.date,
    endDate: event.endDate,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    teams: event.teams.map((team) => team.name),
    path: event.path,
  }));
  // An event is upcoming until its last day is over. The list arrives latest first.
  const upcoming = events.filter((event) => (event.endDate ?? event.date) >= today).reverse();
  const past = events.filter((event) => (event.endDate ?? event.date) < today);

  return (
    <>
      <SiteHeader />
      <main className="public-club bg-club-navy text-white">
        <section className="club-page-hero bg-black px-6 pt-6 pb-8 text-white sm:px-10 sm:pt-8 sm:pb-10 lg:px-14">
          <div className="mx-auto max-w-[1920px]">
            <h1 className="text-5xl leading-tight font-semibold uppercase sm:text-6xl lg:text-7xl">Notikumi</h1>
          </div>
        </section>
        <div className="px-6 pt-10 pb-16 sm:px-10 sm:pt-14 sm:pb-24 lg:px-14">
          <EventsDirectory upcoming={upcoming} past={past} />
        </div>
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
