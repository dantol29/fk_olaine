import type { Metadata } from "next";

import { CalendarSection } from "@/components/calendar-section";
import { Hero } from "@/components/hero";
import { HomeNewsCarousel } from "@/components/home-news-carousel";
import { JoinTeamCta } from "@/components/join-team-cta";
import { PartnersBar } from "@/components/partners-bar";
import { QuickLinksSection } from "@/components/quick-links-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WideScreenFillers } from "@/components/wide-screen-fillers";

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
      <div className="px-6">
        <div className="relative mx-auto max-w-[1440px]">
          <WideScreenFillers />
          <PartnersBar />
          <div className="grid grid-cols-1 items-stretch gap-4 pb-8 lg:grid-cols-2 lg:gap-5">
            <div className="order-1 h-full lg:order-2">
              <HomeNewsCarousel />
            </div>
            <h2 className="order-2 text-3xl text-club-navy sm:text-4xl lg:hidden pt-4">
              Ātrās saites
            </h2>
            <div className="order-3 h-full lg:order-1">
              <QuickLinksSection />
            </div>
          </div>
        </div>
      </div>
      <CalendarSection />
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
