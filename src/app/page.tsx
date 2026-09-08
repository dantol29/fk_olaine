import { CalendarSection } from "@/components/calendar-section";
import { Hero } from "@/components/hero";
import { JoinTeamCta } from "@/components/join-team-cta";
import { PartnersBar } from "@/components/partners-bar";
import { QuickLinksSection } from "@/components/quick-links-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WideScreenFillers } from "@/components/wide-screen-fillers";

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
          <QuickLinksSection />
        </div>
      </div>
      <CalendarSection />
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
