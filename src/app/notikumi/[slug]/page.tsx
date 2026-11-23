import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";

import { ClubPageGallery } from "@/components/club-page-gallery";
import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { eventIdFromSlug, eventSlug, formatEventSpan } from "@/lib/events";
import { getPublicEvent } from "@/lib/events-server";
import { sanitizeRichText } from "@/lib/rich-text";

type EventPageProps = { params: Promise<{ slug: string }> };

async function findEvent(slug: string) {
  const id = eventIdFromSlug(slug);
  return id === null ? null : getPublicEvent(id);
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const event = await findEvent((await params).slug);
  if (!event) return {};
  return {
    title: event.title,
    description: `${formatEventSpan(event.date, event.startTime, event.endDate, event.endTime)}, ${event.location}`,
    alternates: { canonical: event.path },
    ...(event.image ? { openGraph: { title: event.title, images: [{ url: event.image }] } } : {}),
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await findEvent(slug);
  if (!event) notFound();
  // An address with an old title, or only the id, moves to the current one.
  if (slug !== eventSlug(event.id, event.title)) permanentRedirect(event.path);

  return (
    <>
      <SiteHeader />
      <main className="public-club bg-club-navy text-white">
        <section className="club-page-hero bg-black px-6 pt-6 pb-8 text-white sm:px-10 sm:pt-8 sm:pb-10 lg:px-14">
          <div className="mx-auto max-w-[1920px]">
            <p className="mb-3 text-sm font-semibold uppercase text-white/60">Notikums</p>
            <h1 className="max-w-[1200px] text-5xl leading-tight font-semibold break-words uppercase sm:text-6xl lg:text-7xl">{event.title}</h1>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-base text-white/80 sm:text-lg">
              <span className="flex items-center gap-2 tabular-nums"><CalendarDays className="size-5 shrink-0" aria-hidden="true" />{formatEventSpan(event.date, event.startTime, event.endDate, event.endTime)}</span>
              <span className="flex items-center gap-2"><MapPin className="size-5 shrink-0" aria-hidden="true" />{event.location}</span>
              {/* No teams says nothing: the event may be a town event that only takes the place. */}
              {event.teams.length > 0 && <span className="flex items-center gap-2"><Users className="size-5 shrink-0" aria-hidden="true" />{event.teams.map((team) => team.name).join(", ")}</span>}
            </div>
          </div>
        </section>
        <article className="px-6 pt-10 pb-16 sm:px-10 sm:pt-14 sm:pb-24 lg:px-14">
          <div className="mx-auto max-w-[888px]">
            {event.image && (
              <div className="relative mb-10 aspect-[16/9] w-full overflow-hidden">
                <Image src={event.image} alt={event.title} fill sizes="(min-width: 900px) 888px, 100vw" className="object-cover" />
              </div>
            )}
            {event.description && (
              <div
                className="rich-page-content club-page-content min-w-0 text-base leading-[1.65] break-words text-black/85 sm:text-lg"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(event.description) }}
              />
            )}
            {event.gallery.length > 0 && (
              <div className="mt-12 border-t border-black/10 pt-10 sm:mt-16">
                <ClubPageGallery title={event.title} layout="gallery" photos={event.gallery.map((src) => ({ src, alt: "", caption: "" }))} />
              </div>
            )}
          </div>
        </article>
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
