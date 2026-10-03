import { getPublishedClubPages } from "@/lib/club-pages-server";
import { SiteHeaderClient } from "@/components/site-header-client";

export async function SiteHeader({ overlay = false }: { overlay?: boolean } = {}) {
  const clubPages = await getPublishedClubPages();
  return (
    <SiteHeaderClient
      overlay={overlay}
      clubPages={clubPages.map((page) => ({ title: page.title, href: `/klubs/${page.slug}` }))}
    />
  );
}
