import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getArticleBySlug } from "@/lib/jaunumi-server";
import { ArticleDetail } from "@/components/article-detail";
import { RelatedNews } from "@/components/related-news";
import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

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
      <main className="bg-background">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <section aria-labelledby="article-title" className="home-hero-stage relative bg-club-navy">
          <SiteHeader overlay />
          <div className="home-hero-frame home-hero-news relative flex flex-col">
            <div className="hero-news-slide relative flex flex-1 flex-col justify-end">
              <Image src={article.image} alt="" fill preload sizes="100vw" className="object-cover" />
              <div className="hero-photo-shade absolute inset-0" />
              <div className="hero-news-content article-news-content relative z-10">
                <p className="hero-news-meta mb-4 flex flex-wrap items-center gap-3 font-medium text-white/85">
                  <span>{article.date}</span><span>{article.team ?? "Jaunumi"}</span>
                </p>
                <h1 id="article-title" className="text-white">{article.title}</h1>
              </div>
            </div>
          </div>
        </section>
        <ArticleDetail article={article} />
        <RelatedNews slug={slug} />
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
