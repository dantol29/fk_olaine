import { getSiteSettings } from "@/lib/site-settings";
import { SiteHeaderClient } from "@/components/site-header-client";

export async function SiteHeader() {
  const settings = await getSiteSettings();
  return <SiteHeaderClient phone={settings.phone} email={settings.email} />;
}
