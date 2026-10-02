import Image from "next/image";
import Link from "next/link";

import { getRelatedArticles } from "@/lib/jaunumi-server";

export async function RelatedNews({ slug }: { slug: string }) {
  const articles = await getRelatedArticles(slug, 5);
  const featured = articles[0];
  const otherArticles = Array.from({ length: 4 }, (_, index) => articles[index + 1]);

  return (
    <section aria-labelledby="related-news-heading" className="bg-black px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-14">
      <div className="mx-auto max-w-[1920px]">
        <h2 id="related-news-heading" className="mb-8 text-4xl leading-tight font-semibold uppercase sm:mb-10 sm:text-5xl lg:text-6xl">Saistītie jaunumi</h2>
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {featured ? (
          <Link href={`/jaunumi/${featured.slug}`} className="relative flex aspect-[4/3] min-h-80 flex-col justify-end overflow-hidden p-6 focus-visible:outline-white sm:p-8 lg:aspect-auto lg:min-h-[560px]">
            <Image src={featured.image} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            <div className="relative">
              <p className="mb-4 text-sm text-white/80">{featured.date}</p>
              <h3 className="text-2xl leading-tight font-semibold sm:text-3xl xl:text-4xl">{featured.title}</h3>
            </div>
          </Link>
          ) : (
            <div className="relative flex aspect-[4/3] min-h-80 flex-col justify-end bg-[#171717] p-6 sm:p-8 lg:aspect-auto lg:min-h-[560px]">
              <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                <Image src="/fk-olaine-crest-v2.png" alt="" width={124} height={128} className="h-32 w-auto grayscale opacity-20" />
              </div>
              <p className="relative text-2xl font-semibold text-white/50 sm:text-3xl">Raksts vēl nav pieejams</p>
            </div>
          )}
            <div className="flex flex-col gap-5">
              {otherArticles.map((article, index) => article ? (
                <Link key={article.slug} href={`/jaunumi/${article.slug}`} className="grid flex-1 grid-cols-[32%_1fr] items-center gap-4 focus-visible:outline-white sm:gap-6">
                  <div className="relative aspect-[5/3] overflow-hidden">
                    <Image src={article.image} alt="" fill sizes="(min-width: 1024px) 16vw, 32vw" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="mb-2 text-xs text-white/60 sm:mb-4 sm:text-sm">{article.date}</p>
                    <h3 className="text-base leading-snug font-semibold sm:text-xl xl:text-2xl">{article.title}</h3>
                  </div>
                </Link>
              ) : (
                <div key={`placeholder-${index}`} className="grid flex-1 grid-cols-[32%_1fr] items-center gap-4 sm:gap-6">
                  <div aria-hidden="true" className="flex aspect-[5/3] items-center justify-center bg-[#171717]">
                    <Image src="/fk-olaine-crest-v2.png" alt="" width={62} height={64} className="h-12 w-auto grayscale opacity-20 sm:h-16" />
                  </div>
                  <p className="text-base leading-snug font-semibold text-white/40 sm:text-xl xl:text-2xl">Raksts vēl nav pieejams</p>
                </div>
              ))}
            </div>
        </div>
        <div className="mt-8 flex justify-center">
          <Link href="/jaunumi" className="inline-flex min-h-14 items-center justify-center bg-club-red px-6 text-base font-semibold uppercase hover:bg-club-red-dark focus-visible:outline-white">Skatīt vairāk</Link>
        </div>
      </div>
    </section>
  );
}
