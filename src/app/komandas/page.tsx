import type { Metadata } from "next";

import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TeamsDirectory } from "@/components/teams-directory";
import { getTeamsRoster } from "@/components/home-teams-section";

export const metadata: Metadata = {
  title: "Komandas",
  description:
    "FK Olaine komandas — no akadēmijas līdz pirmajai komandai. Iepazīsties ar spēlētājiem visās vecuma grupās.",
  alternates: { canonical: "/komandas" },
};

export default async function KomandasPage() {
  const teams = await getTeamsRoster();

  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        <TeamsDirectory teams={teams} />
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
