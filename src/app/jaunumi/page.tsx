import { JaunumiDirectory } from "@/components/jaunumi-directory";
import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getArticles, getFeaturedArticles } from "@/lib/jaunumi-server";

export default async function JaunumiPage() {
  const [articles, featuredArticles] = await Promise.all([
    getArticles(),
    getFeaturedArticles(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <JaunumiDirectory articles={articles} featuredArticles={featuredArticles} />
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
