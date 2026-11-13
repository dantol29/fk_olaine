import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getArticles } from "@/lib/jaunumi-server";

export async function HomeNews() {
  const articles = (await getArticles()).slice(0, 3);
  if (!articles.length) return null;
  return <section aria-labelledby="home-news-heading" className="bg-club-navy px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
    <div className="mx-auto max-w-[1280px] 2xl:max-w-[1600px]">
      <div className="mb-7 flex items-center justify-between gap-4"><h2 id="home-news-heading" className="text-2xl font-semibold uppercase text-white sm:text-3xl">Jaunumi</h2><Link href="/jaunumi" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white hover:text-white/70">Visi jaunumi <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <Link key={article.slug} href={`/jaunumi/${article.slug}`} className="group grid grid-cols-[112px_1fr] overflow-hidden rounded-3xl bg-club-navy-light transition-colors hover:bg-[#223650] sm:block">
        <div className="relative min-h-28 overflow-hidden bg-club-navy sm:aspect-[16/9]"><Image src={article.image} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 112px" className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none" /></div>
        <div className="p-4 sm:p-5"><p className="text-xs font-medium text-white/60">{article.date}</p><h3 className="mt-2 text-base leading-snug font-semibold text-white group-hover:text-white/80 sm:text-lg">{article.title}</h3></div>
      </Link>)}</div>
    </div>
  </section>;
}
