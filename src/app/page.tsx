import type { Metadata } from "next";

import { BirthdaysSection } from "@/components/birthdays-section";
import { Hero } from "@/components/hero";
import { HomeNews } from "@/components/home-news";
import { HomePollsSection } from "@/components/home-polls-section";
import { HomeTeamsSection } from "@/components/home-teams-section";
import { HomeUpcomingGames } from "@/components/home-upcoming-games";
import { HomeStandingsSection } from "@/components/home-standings-section";
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

export default async function Home() {
  const poll = await HomePollsSection();
  return (
    <>
      <main className="home-content bg-club-navy text-white">
        <h1 className="sr-only">FK Olaine — Olaines futbola klubs</h1>
        <Hero />
        <HomeNews />
        <HomeStandingsSection upcoming={<HomeUpcomingGames />} />
        <section className="bg-club-navy px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
          <div className="mx-auto max-w-[1600px] 2xl:max-w-[1920px]">
            <HomeTeamsSection />
          </div>
        </section>
        <section className="bg-club-navy px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
          <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-2 lg:gap-16 2xl:max-w-[1600px]">
            {poll ? <>
              <div className="min-w-0 [container-type:inline-size]">{poll}</div>
              <div className="flex min-w-0 flex-col gap-12"><UpcomingBirthdays /><TopScorersList /></div>
            </> : <><UpcomingBirthdays /><TopScorersList /></>}
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
