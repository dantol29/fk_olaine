import { getArticles } from "@/lib/jaunumi-server";
import { NewsCarousel } from "@/components/news-carousel";

export async function HomeNewsCarousel() {
  const articles = await getArticles();
  const items = articles.slice(0, 6).map((article) => ({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    date: article.date,
    image: article.image,
  }));

  return (
    <div className="flex h-full flex-col gap-3">
      <h2 className="text-3xl text-club-navy sm:text-4xl pt-4 lg:hidden">Jaunumi</h2>
      <div className="min-h-0 flex-1">
        <NewsCarousel articles={items} />
      </div>
    </div>
  );
}
