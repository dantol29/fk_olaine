import Image from "next/image";
import Link from "next/link";

import type { Article } from "@/lib/jaunumi";
import { cn } from "@/lib/utils";

export function FeaturedNews({ articles }: { articles: Article[] }) {
  const slots = Array.from({ length: 4 }, (_, index) => articles[index]);

  return (
    <section aria-labelledby="featured-news-heading" className="bg-black px-6 pt-10 pb-12 text-white sm:px-10 sm:pt-14 sm:pb-16 lg:px-14">
      <div className="mx-auto max-w-[1920px]">
        <h1 id="featured-news-heading" className="mb-8 text-4xl leading-tight font-semibold uppercase sm:mb-10 sm:text-5xl lg:text-6xl">Jaunumi</h1>
        <div className="grid auto-rows-[250px] gap-5 sm:grid-cols-2 sm:auto-rows-[230px] lg:grid-cols-4 lg:auto-rows-[clamp(230px,18vw,360px)]">
          {slots.map((article, index) => {
            const tileClass = cn(
              "relative flex min-w-0 flex-col justify-end overflow-hidden bg-[#171717] p-5 sm:p-7",
              index === 0 && "min-h-[380px] sm:row-span-2 sm:min-h-0 lg:col-span-2",
              index === 1 && "lg:col-span-2",
            );
            if (!article) return (
              <div key={`placeholder-${index}`} className={tileClass}>
                <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                  <Image src="/fk-olaine-crest-v2.png" alt="" width={124} height={128} className="h-24 w-auto grayscale opacity-20" />
                </div>
                <p className="relative text-xl font-semibold text-white/40">Raksts vēl nav pieejams</p>
              </div>
            );
            return (
              <Link key={article.slug} href={`/jaunumi/${article.slug}`} className={cn(tileClass, "focus-visible:outline-white")}>
                <Image src={article.image} alt="" fill preload={index === 0} sizes={index < 2 ? "(min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"} className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <div className="relative">
                  <p className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/85"><span>{article.date}</span><span>{article.team ?? article.category}</span></p>
                  <h2 className={cn("text-xl leading-tight font-semibold xl:text-2xl", index === 0 && "sm:text-2xl xl:text-3xl")}>{article.title}</h2>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
