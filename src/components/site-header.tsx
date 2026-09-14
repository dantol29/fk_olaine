import { getPublishedClubPages } from "@/lib/club-pages-server";
import { getSiteSettings } from "@/lib/site-settings";
import { SiteHeaderClient } from "@/components/site-header-client";

export async function SiteHeader() {
  const [settings, clubPages] = await Promise.all([getSiteSettings(), getPublishedClubPages()]);
  return (
    <SiteHeaderClient
      phone={settings.phone}
      email={settings.email}
      clubPages={clubPages.map((page) => ({ title: page.title, href: `/klubs/${page.slug}` }))}
    />
  );
}
