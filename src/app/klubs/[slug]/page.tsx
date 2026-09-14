import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";

import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db/client";
import { clubPages } from "@/db/schema";

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
      <main className="bg-background">
        <section className="px-6 pt-14 sm:pt-14">
          <div className="mx-auto max-w-[1440px]">
            <div className="relative flex min-h-24 flex-col justify-center sm:min-h-32">
              <span aria-hidden className="pointer-events-none absolute top-1/2 left-0 max-w-full -translate-y-1/2 overflow-hidden text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:text-8xl">
                {page.title}
              </span>
              <h1 className="relative text-4xl tracking-[-0.02em] text-club-navy sm:text-5xl">{page.title}</h1>
            </div>
          </div>
        </section>
        <article className="px-6 py-8 pb-20 sm:pb-28">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
            <div
              className="rich-page-content min-w-0 break-words text-base leading-8 text-slate-700 sm:text-lg sm:leading-9"
              dangerouslySetInnerHTML={{ __html: page.body }}
            />
            {images.length > 0 && (
              <aside className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1" aria-label="Lapas attēli">
                {images.map((url, index) => (
                  <div key={url} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                    <Image src={url} alt={`${page.title} — ${index + 1}. attēls`} fill
                      sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                  </div>
                ))}
              </aside>
            )}
          </div>
        </article>
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
