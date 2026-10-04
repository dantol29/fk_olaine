import type { Metadata } from "next";

import { BirthdaysSection } from "@/components/birthdays-section";
import { Hero } from "@/components/hero";
import { HomePollsSection } from "@/components/home-polls-section";
import { HomeTeamsSection } from "@/components/home-teams-section";
import { HomeUpcomingGames } from "@/components/home-upcoming-games";
import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
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
      <main className="home-content bg-white text-black">
        <h1 className="sr-only">FK Olaine — Olaines futbola klubs</h1>
        <Hero />
        <HomeUpcomingGames />
        <section className="bg-white px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
          <div className="mx-auto max-w-[1600px]">
            <HomePollsSection />
          </div>
        </section>
        <section className="bg-white px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
          <div className="mx-auto max-w-[1600px]">
            <HomeTeamsSection />

          </div>
        </section>
        <section className="bg-white px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
              <TopScorersList />
              <UpcomingBirthdays />
            </div>
          </div>
        </section>
        {/* Hidden per request — kept mounted (not removed) so it's a
         *  one-line toggle to bring back. */}
        <div className="hidden">
          <BirthdaysSection />
        </div>
        <JoinTeamCta />
      </main>
      <SiteFooter />
    </>
  );
}
