import * as cheerio from "cheerio";

export type ScrapedFixture = {
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:MM", or null if LFF hasn't published a kickoff time yet. */
  time: string | null;
  home: string;
  away: string;
  /** LFF-hosted logo image URL for each side, or null if LFF has none on
   *  file for that club. */
  homeLogo: string | null;
  awayLogo: string | null;
  stadium: string;
  played: boolean;
};

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  mai: 5,
  jūn: 6,
  jūl: 7,
  aug: 8,
  sep: 9,
  okt: 10,
  nov: 11,
  dec: 12,
};

/** LFF fixtures pages carry the "which tab is this" info directly in their
 *  own URL (`?tab=content_1_2`) — the tab element's id is "tab" plus that
 *  value with its first letter capitalized (`tabContent_1_2`), so there's
 *  nothing extra for an admin to configure. */
function tabIdFromUrl(url: string): string {
  const tab = new URL(url).searchParams.get("tab");
  if (!tab) {
    throw new Error(`LFF fixtures URL is missing a "tab" query parameter: ${url}`);
  }
  return `tab${tab.charAt(0).toUpperCase()}${tab.slice(1)}`;
}

export async function scrapeFixtures(url: string): Promise<ScrapedFixture[]> {
  const tabId = tabIdFromUrl(url);

  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; FKOlaineSite/1.0)",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch LFF fixtures: ${res.status}`);
  }

  const $ = cheerio.load(await res.text());
  const fixtures: ScrapedFixture[] = [];

  $(`#${tabId} .tr.match`).each((_, el) => {
    const $el = $(el);
    const clubEls = $el.find(".club");
    if (clubEls.length < 2) return;

    const clubs = clubEls
      .map((_, club) => ({
        name: $(club).find(".title a").text().trim(),
        logo: $(club).find(".logo img").attr("src") ?? null,
      }))
      .get();
    const scores = $el
      .find(".result span")
      .map((_, s) => $(s).text().trim())
      .get();

    const [home, away] = clubs;
    const [homeScore, awayScore] = scores;
    const played = homeScore !== "-" && awayScore !== "-";

    const day = $el.find(".date h5").text().trim();
    const monthAbbr = $el.find(".date h6").text().trim().toLowerCase();
    const timeText = $el.find(".date .h7").text().trim();
    const year = $el.find(".date .h8").text().trim();
    const month = MONTHS[monthAbbr] ?? 0;

    const timeMatch = timeText.match(/^(\d{1,2}):(\d{2})$/);
    const time = timeMatch ? `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}` : null;

    fixtures.push({
      date: `${year}-${String(month).padStart(2, "0")}-${day.padStart(2, "0")}`,
      time,
      home: home.name,
      away: away.name,
      homeLogo: home.logo,
      awayLogo: away.logo,
      stadium: $el.find(".stadium").text().trim(),
      played,
    });
  });

  return fixtures;
}
