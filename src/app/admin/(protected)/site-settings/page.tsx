import { getSiteSettings } from "@/lib/site-settings";

import { SiteSettingsForm } from "./site-settings-form";

export default async function AdminSiteSettingsPage() {
  const settings = await getSiteSettings();

  return <SiteSettingsForm settings={settings} />;
}
