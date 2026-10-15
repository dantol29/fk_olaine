import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db/client";
import { clubPages } from "@/db/schema";
import { ClubPageGallery } from "@/components/club-page-gallery";
import { parseClubPageMedia } from "@/lib/club-page-media";
import { sanitizeRichText } from "@/lib/rich-text";

async function findPage(slug: string) {
  const [page] = await db.select().from(clubPages).where(eq(clubPages.slug, slug));
  return page?.isPublished ? page : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await findPage(slug);
  if (!page) return {};
  const image = parseClubPageMedia(page.images).photos[0]?.src;
  return { title: page.title, description: page.description, ...(image ? { openGraph: { images: [image] } } : {}) };
}

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await findPage(slug);
  if (!page) notFound();
  const media = parseClubPageMedia(page.images);
  const sidebar = media.layout === "sidebar" && media.photos.length > 0;

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
          <div className={`mx-auto ${sidebar ? "grid max-w-[1280px] gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" : "max-w-[888px]"}`}>
            <div className="min-w-0">
            {page.description && <p className="mb-8 text-lg leading-relaxed font-medium sm:mb-10 sm:text-xl">{page.description}</p>}
            <div
              className="rich-page-content club-page-content min-w-0 text-base leading-[1.65] break-words text-black/85 sm:text-lg"
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.body) }}
            />
            {media.actions.length > 0 && <div className="mt-8 flex flex-wrap gap-3">{media.actions.map((action, index) => <a key={index} href={action.href} target={action.newTab ? "_blank" : undefined} rel={action.newTab ? "noopener noreferrer" : undefined} className={`motion-action inline-flex min-h-12 max-w-full items-center justify-center gap-3 border px-5 py-3 text-center text-sm leading-snug font-semibold uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-club-red ${action.style === "primary" ? "border-club-red bg-club-red text-white hover:border-club-red-dark hover:bg-club-red-dark" : "border-club-navy text-club-navy hover:bg-club-navy hover:text-white"}`}>
              <span className="min-w-0 break-words">{action.label}</span><ArrowUpRight className="action-diagonal size-4 shrink-0" aria-hidden="true" />{action.newTab && <span className="sr-only"> (atveras jaunā cilnē)</span>}
            </a>)}</div>}
            </div>
            {media.photos.length > 0 && (
              <div className={sidebar ? "min-w-0" : "mt-12 border-t border-black/10 pt-10 sm:mt-16"}>
                <ClubPageGallery photos={media.photos} title={page.title} layout={media.layout} />
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
