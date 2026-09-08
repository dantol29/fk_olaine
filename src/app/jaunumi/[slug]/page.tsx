import { notFound } from "next/navigation";

import { getUpcomingGamesFromDb } from "@/lib/games-server";
import { ARTICLES } from "@/lib/jaunumi-articles";
import { ArticleDetail } from "@/components/article-detail";
import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = ARTICLES.find((item) => item.slug === slug);
  if (!article) notFound();

  const upcomingGames = await getUpcomingGamesFromDb(1);
  const nextGame = upcomingGames[0] ?? null;

  const related = ARTICLES.filter((item) => item.slug !== slug)
    .slice(0, 4)
    .map((item) => ({
      title: item.title,
      date: item.date,
      image: item.image,
    }));

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <ArticleDetail article={article} related={related} nextGame={nextGame} />
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
