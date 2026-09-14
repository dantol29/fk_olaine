import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getArticleBySlug } from "@/lib/jaunumi-server";
import { ArticleDetail } from "@/components/article-detail";
import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

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

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: [`${SITE_URL}${article.image}`],
    datePublished: article.date,
    author: article.authorName
      ? { "@type": "Person", name: article.authorName }
      : { "@type": "Organization", name: "FK Olaine" },
    publisher: {
      "@type": "Organization",
      name: "FK Olaine",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/fk-olaine-crest-v2.png` },
    },
    mainEntityOfPage: `${SITE_URL}/jaunumi/${slug}`,
  };

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <ArticleDetail article={article} />
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
