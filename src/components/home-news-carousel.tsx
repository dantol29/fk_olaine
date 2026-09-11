import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getArticles } from "@/lib/jaunumi-server";
import { NewsCarousel } from "@/components/news-carousel";

export async function HomeNewsCarousel({ embedded = false }: { embedded?: boolean }) {
  const articles = await getArticles();
  const items = articles.slice(0, 3).map((article) => ({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    date: article.date,
    image: article.image,
  }));

  if (embedded) {
    return <NewsCarousel articles={items} className="min-h-0" />;
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3 pt-4">
        <h2 className="text-3xl text-club-navy sm:text-4xl">Jaunumi</h2>
        <Link
          href="/jaunumi"
          className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 py-1.5 pr-1.5 pl-4 text-xs font-semibold text-club-navy transition hover:border-slate-300 sm:gap-3 sm:pl-5 sm:text-sm"
        >
          Skatīt visus
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 sm:h-8 sm:w-8">
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        <NewsCarousel articles={items} />
      </div>
    </div>
  );
}
