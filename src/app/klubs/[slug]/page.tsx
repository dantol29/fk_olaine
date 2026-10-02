import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db/client";
import { clubPages } from "@/db/schema";
import { ArticleImagesCarousel } from "@/components/article-detail";

async function findPage(slug: string) {
  const [page] = await db.select().from(clubPages).where(eq(clubPages.slug, slug));
  return page?.isPublished ? page : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await findPage(slug);
  if (!page) return {};
  return { title: page.title, description: page.description };
}

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await findPage(slug);
  if (!page) notFound();
  const images = page.images?.split("\n").filter(Boolean) ?? [];

  return (
    <>
      <SiteHeader />
      <main className="bg-white text-black">
        <section className="club-page-hero bg-black px-6 pt-6 pb-8 text-white sm:px-10 sm:pt-8 sm:pb-10 lg:px-14">
          <div className="mx-auto max-w-[1920px]">
            <h1 className="max-w-[1200px] text-5xl leading-tight font-semibold break-words uppercase sm:text-6xl lg:text-7xl">{page.title}</h1>
          </div>
        </section>
        <article className="px-6 pt-10 pb-16 sm:px-10 sm:pt-14 sm:pb-24 lg:px-14">
          <div className="mx-auto max-w-[888px]">
            {page.description && <p className="mb-8 text-lg leading-relaxed font-medium sm:mb-10 sm:text-xl">{page.description}</p>}
            <div
              className="rich-page-content club-page-content min-w-0 text-base leading-[1.65] break-words text-black/85 sm:text-lg"
              dangerouslySetInnerHTML={{ __html: page.body }}
            />
            {images.length > 0 && (
              <div className="mt-12 border-t border-black/10 pt-10 sm:mt-16">
                <ArticleImagesCarousel images={images} label={`${page.title} — galerija`} />
              </div>
            )}
          </div>
        </article>
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
