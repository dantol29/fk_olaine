import { getPublishedClubPages } from "@/lib/club-pages-server";
import { getSiteSettings } from "@/lib/site-settings";
import { SiteHeaderClient } from "@/components/site-header-client";
import { getNextMatch } from "@/lib/games-server";

export async function SiteHeader({ overlay = false }: { overlay?: boolean } = {}) {
  const [settings, clubPages, nextMatch] = await Promise.all([getSiteSettings(), getPublishedClubPages(), getNextMatch()]);
  return (
    <SiteHeaderClient
      phone={settings.phone}
      email={settings.email}
      overlay={overlay}
      nextMatch={nextMatch}
      clubPages={clubPages.map((page) => ({ title: page.title, href: `/klubs/${page.slug}` }))}
    />
  );
}
