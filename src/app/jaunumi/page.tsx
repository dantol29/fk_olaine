import type { Metadata } from "next";

import { JaunumiDirectory } from "@/components/jaunumi-directory";
import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getArticles } from "@/lib/jaunumi-server";

export const metadata: Metadata = {
  title: "Jaunumi",
  description:
    "FK Olaine jaunumi — notikumi, spēļu rezultāti un stāsti no kluba dzīves.",
  alternates: { canonical: "/jaunumi" },
};

export default async function JaunumiPage() {
  const articles = await getArticles();

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <JaunumiDirectory articles={articles} />
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
