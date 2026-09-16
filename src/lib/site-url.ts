const PRODUCTION_SITE_URL = "https://fkolaine.com";
const LEGACY_HOSTS = new Set(["test.afaolaine.lv"]);

export function getSiteUrl(): string {
  const configured = process.env.SITE_URL?.trim();
  if (!configured) return PRODUCTION_SITE_URL;

  try {
    const url = new URL(configured);
    if (LEGACY_HOSTS.has(url.hostname.toLowerCase())) return PRODUCTION_SITE_URL;
    return url.href.replace(/\/$/, "");
  } catch {
    return PRODUCTION_SITE_URL;
  }
}
