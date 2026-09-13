import type { Metadata } from "next";

import { BirthdaysSection } from "@/components/birthdays-section";
import { CalendarSection } from "@/components/calendar-section";
import { Hero } from "@/components/hero";
import { HomeCoachesSection } from "@/components/home-coaches-section";
import { HomePollsSection } from "@/components/home-polls-section";
import { HomeTeamsSection } from "@/components/home-teams-section";
import { HomeUpcomingGames } from "@/components/home-upcoming-games";
import { HomeUpcomingTrainings } from "@/components/home-upcoming-trainings";
import { JoinTeamCta } from "@/components/join-team-cta";
import { PartnersBar } from "@/components/partners-bar";
import { SiteFooter } from "@/components/site-footer";
import { CoachesList } from "@/components/coaches-list";
import { SiteHeader } from "@/components/site-header";
import { TopScorersList } from "@/components/top-scorers-list";
import { UpcomingBirthdays } from "@/components/upcoming-birthdays";

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
        <HomeUpcomingGames />
        <div className="px-6 pt-8 sm:pt-10">
          <div className="relative mx-auto max-w-[1440px]">
            <HomePollsSection />
          </div>
        </div>
        <div className="px-6 pt-16 pb-10 sm:pt-20">
          <div className="relative mx-auto max-w-[1440px]">
            <PartnersBar />
          </div>
        </div>
        <section className="px-6 pb-8 pt-4 sm:pt-8">
          <div className="relative mx-auto max-w-[1440px]">
            <HomeTeamsSection />

            <div className="relative mt-12 flex min-h-24 flex-col justify-center sm:mt-16 sm:min-h-32">
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:text-8xl"
              >
                Kluba dzīve
              </span>
              <h2 className="relative text-3xl tracking-[-0.02em] text-club-navy sm:text-4xl">
                Kluba dzīve
              </h2>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 lg:grid-cols-3 lg:gap-0">
              <CoachesList className="lg:rounded-r-none" />
              <TopScorersList className="lg:rounded-l-none lg:rounded-r-none" />
              <UpcomingBirthdays className="lg:rounded-l-none" />
            </div>
          </div>
        </section>
        <HomeUpcomingTrainings />
        {/* Hidden per request — kept mounted (not removed) so it's a
         *  one-line toggle to bring back. */}
        <div className="hidden">
          <section className="px-6 pb-8 sm:pb-10">
            <div className="relative mx-auto max-w-[1440px]">
              <HomeCoachesSection />
            </div>
          </section>
          <BirthdaysSection />
        </div>
        <CalendarSection />
        <JoinTeamCta />
      </main>
      <SiteFooter />
    </>
  );
}
