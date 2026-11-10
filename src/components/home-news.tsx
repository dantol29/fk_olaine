import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getArticles } from "@/lib/jaunumi-server";

export async function HomeNews() {
  const articles = (await getArticles()).slice(0, 3);
  if (!articles.length) return null;
  return <section aria-labelledby="home-news-heading" className="bg-white px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
    <div className="mx-auto max-w-[1600px]">
      <div className="mb-7 flex items-center justify-between gap-4"><h2 id="home-news-heading" className="text-3xl font-semibold text-club-navy sm:text-4xl">Jaunumi</h2><Link href="/jaunumi" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-club-navy hover:text-club-red">Visi jaunumi <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <Link key={article.slug} href={`/jaunumi/${article.slug}`} className="group grid grid-cols-[112px_1fr] gap-4 sm:block">
        <div className="relative aspect-[4/3] overflow-hidden bg-club-navy sm:aspect-[16/9]"><Image src={article.image} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 112px" className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none" /></div>
        <div className="sm:pt-4"><p className="text-xs text-slate-500">{article.date}</p><h3 className="mt-2 text-base leading-snug font-semibold text-club-navy group-hover:text-club-red sm:text-lg">{article.title}</h3></div>
      </Link>)}</div>
    </div>
  </section>;
}
