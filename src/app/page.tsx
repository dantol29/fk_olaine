import type { Metadata } from "next";
import Link from "next/link";

import { BirthdaysSection } from "@/components/birthdays-section";
import { CalendarSection } from "@/components/calendar-section";
import { Hero } from "@/components/hero";
import { HomeNewsCarousel } from "@/components/home-news-carousel";
import { JoinTeamCta } from "@/components/join-team-cta";
import { PartnersBar } from "@/components/partners-bar";
import { QuickLinksSection } from "@/components/quick-links-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "FK Olaine — Olaines futbola klubs",
  description:
    "FK Olaine — Olaines futbola klubs kopš 2008. gada. Sekojiet līdzi tuvākajām spēlēm, treniņiem un jaunumiem.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <Hero />
      </main>
      <div className="px-6 pt-10 pb-10 sm:pt-14">
        <div className="relative mx-auto max-w-[1440px]">
          <PartnersBar />
        </div>
      </div>
      <section className="px-6 pb-8 pt-4 sm:pt-8">
        <div className="relative mx-auto max-w-[1440px]">
          <div className="mb-5 flex items-center justify-center gap-4 sm:mb-6 sm:justify-between">
            <div className="relative flex min-h-24 min-w-0 flex-1 flex-col items-center justify-center sm:min-h-32 sm:items-start">
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 -rotate-1 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:rotate-0 sm:text-8xl"
              >
                Jaunumi
              </span>
              <h2 className="relative text-center text-3xl tracking-[-0.02em] text-club-navy sm:text-left sm:text-4xl">
                Jaunumi
              </h2>
            </div>
            <Link
              href="/jaunumi"
              className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 py-1.5 pr-1.5 pl-4 text-sm font-semibold text-club-navy transition-colors hover:border-slate-300 sm:flex"
            >
              Visi jaunumi
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 sm:h-8 sm:w-8">
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:auto-rows-[270px] lg:grid-cols-12 lg:gap-5">
            <div className="min-h-[420px] sm:col-span-2 lg:col-span-7 lg:row-span-2 lg:min-h-0">
              <HomeNewsCarousel embedded />
            </div>
            <QuickLinksSection bento />
          </div>
        </div>
      </section>
      <BirthdaysSection />
      <CalendarSection />
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
