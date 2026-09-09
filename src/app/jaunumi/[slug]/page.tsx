import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getUpcomingGamesFromDb } from "@/lib/games-server";
import { getArticleBySlug, getRelatedArticles } from "@/lib/jaunumi-server";
import { ArticleDetail } from "@/components/article-detail";
import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/jaunumi/${slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      images: [{ url: article.image }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [article.image],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const upcomingGames = await getUpcomingGamesFromDb(1);
  const nextGame = upcomingGames[0] ?? null;

  const related = await getRelatedArticles(slug);

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
