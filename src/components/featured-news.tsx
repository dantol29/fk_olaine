import Image from "next/image";
import Link from "next/link";
import { Newspaper } from "lucide-react";

import type { Article } from "@/lib/jaunumi";
import { cn } from "@/lib/utils";

export function FeaturedNews({ articles }: { articles: Article[] }) {
  const slots = Array.from({ length: 4 }, (_, index) => articles[index]);

  return (
    <section aria-labelledby="featured-news-heading" className="bg-black px-6 pt-10 pb-12 text-white sm:px-10 sm:pt-14 sm:pb-16 lg:px-14">
      <div className="mx-auto max-w-[1920px]">
        <h1 id="featured-news-heading" className="mb-8 text-4xl leading-tight font-semibold uppercase sm:mb-10 sm:text-5xl lg:text-6xl">Jaunumi</h1>
        <div className="grid gap-5 sm:grid-cols-2 sm:auto-rows-[230px] lg:grid-cols-4 lg:auto-rows-[clamp(230px,18vw,360px)]">
          {slots.map((article, index) => {
            const tileClass = cn(
              "relative min-w-0 overflow-hidden sm:flex sm:flex-col sm:justify-end sm:bg-[#171717] sm:p-7",
              index === 0 ? "flex aspect-[11/10] min-h-[300px] flex-col justify-end bg-[#171717] p-5 sm:row-span-2 sm:aspect-auto sm:min-h-0 lg:col-span-2" : "grid grid-cols-[28%_minmax(0,1fr)] items-start gap-4 sm:gap-0",
              index === 1 && "lg:col-span-2",
            );
            const imageClass = index === 0 ? "absolute inset-0 overflow-hidden" : "relative aspect-[6/5] w-full overflow-hidden sm:absolute sm:inset-0 sm:aspect-auto";
            if (!article) return (
              <div key={`placeholder-${index}`} className={tileClass}>
                <div aria-hidden="true" className={cn(imageClass, "flex items-center justify-center bg-[#171717]")}>
                  <Image src="/fk-olaine-crest-v2.png" alt="" width={124} height={128} className="h-24 w-auto grayscale opacity-20" />
                </div>
                <p className="relative text-base font-semibold text-white/40 sm:text-xl">Raksts vēl nav pieejams</p>
              </div>
            );
            return (
              <Link key={article.slug} href={`/jaunumi/${article.slug}`} className={cn(tileClass, "card-hover focus-visible:outline-white")}>
                <div className={imageClass}><Image src={article.image} alt="" fill preload={index === 0} sizes={index === 0 ? "(min-width: 640px) 50vw, 100vw" : index === 1 ? "(min-width: 640px) 50vw, 28vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 28vw"} className="card-hover-image object-cover" /></div>
                <div className={cn("absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent", index !== 0 && "hidden sm:block")} />
                <div className="relative">
                  <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/75 sm:mb-4 sm:text-sm"><Newspaper className="size-4 shrink-0" aria-hidden="true" /><span>{article.date}</span><span>{article.team ?? article.category}</span></p>
                  <h2 className={cn("leading-snug font-semibold sm:text-xl sm:leading-tight xl:text-2xl", index === 0 ? "text-xl sm:text-2xl xl:text-3xl" : "text-base")}>{article.title}</h2>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
