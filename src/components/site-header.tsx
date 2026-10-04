import { getPublishedClubPages } from "@/lib/club-pages-server";
import { SiteHeaderClient } from "@/components/site-header-client";
import { getSiteSettings } from "@/lib/site-settings";

export async function SiteHeader({ overlay = false }: { overlay?: boolean } = {}) {
  const [clubPages, settings] = await Promise.all([getPublishedClubPages(), getSiteSettings()]);
  return (
    <SiteHeaderClient
      overlay={overlay}
      headerLinks={{
        headerTvName: settings.headerTvName,
        headerTvUrl: settings.headerTvUrl,
        headerJoinName: settings.headerJoinName,
        headerJoinUrl: settings.headerJoinUrl,
        headerFederationName: settings.headerFederationName,
        headerFederationUrl: settings.headerFederationUrl,
      }}
      clubPages={clubPages.map((page) => ({ title: page.title, href: `/klubs/${page.slug}` }))}
    />
  );
}
