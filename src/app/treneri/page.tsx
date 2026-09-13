import type { Metadata } from "next";

import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { HomeTeamsPanel } from "@/components/home-teams-panel";
import { getTeamsRoster } from "@/components/home-teams-section";

export const metadata: Metadata = {
  title: "Treneri",
  description:
    "FK Olaine treneru kolektīvs — licencēti treneri, kas ikdienā strādā ar kluba komandām visās vecuma grupās.",
  alternates: { canonical: "/treneri" },
};

export default async function TreneriPage() {
  const teams = await getTeamsRoster();

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <section className="px-6 pt-14 sm:pt-14">
          <div className="mx-auto max-w-[1440px]">
            <div className="relative flex min-h-24 flex-col justify-center sm:min-h-32">
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:text-8xl"
              >
                Treneri
              </span>
              <h1 className="relative text-4xl tracking-[-0.02em] text-club-navy sm:text-5xl">
                Treneri
              </h1>
            </div>
          </div>
        </section>

        <section className="px-6 py-8">
          <div className="mx-auto max-w-[1440px]">
            <HomeTeamsPanel teams={teams} bare defaultTab="coaches" showTabs={false} />
          </div>
        </section>
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
