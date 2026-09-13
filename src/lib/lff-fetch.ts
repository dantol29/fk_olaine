const REQUEST_TIMEOUT_MS = 12_000;
const MAX_RESPONSE_BYTES = 5_000_000;

export async function fetchLffHtml(url: string, resource: string): Promise<string> {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== "https:" || !/(^|\.)lff\.lv$/i.test(parsedUrl.hostname)) {
    throw new Error(`Invalid LFF ${resource} URL: ${url}`);
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(parsedUrl, {
        next: { revalidate: 3600 },
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "lv-LV,lv;q=0.9,en;q=0.7",
          "User-Agent": "Mozilla/5.0 (compatible; FKOlaineSite/1.0; +https://fkolaine.lv)",
        },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const type = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (type && !type.includes("html") && !type.includes("xhtml")) throw new Error(`unexpected content type ${type}`);
      const html = await response.text();
      if (html.length < 500) throw new Error("response was unexpectedly short");
      if (html.length > MAX_RESPONSE_BYTES) throw new Error("response was unexpectedly large");
      if (!/<html|<!doctype/i.test(html)) throw new Error("response was not HTML");
      return html;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250));
    } finally {
      clearTimeout(timeout);
    }
  }
  const detail = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Failed to fetch LFF ${resource}: ${detail}`);
}

export function normalizeLffText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export function absoluteLffUrl(value: string | undefined, pageUrl: string): string | null {
  if (!value) return null;
  try { return new URL(value, pageUrl).href; } catch { return null; }
}
