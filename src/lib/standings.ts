import * as cheerio from "cheerio";

export type StandingRow = {
  pos: number;
  team: string;
  logo: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  isOlaine: boolean;
};

function toInt(value: string) {
  return parseInt(value.replace("+", "").trim(), 10);
}

/** LFF pages carry the "which tab is this" info directly in their own URL
 *  (`?tab=content_1_4`) — the tab element's id is "tab" plus that value
 *  with its first letter capitalized (`tabContent_1_4`), so there's
 *  nothing extra for an admin to configure. */
function tabIdFromUrl(url: string): string {
  const tab = new URL(url).searchParams.get("tab");
  if (!tab) {
    throw new Error(`LFF standings URL is missing a "tab" query parameter: ${url}`);
  }
  return `tab${tab.charAt(0).toUpperCase()}${tab.slice(1)}`;
}

export async function getStandings(url: string): Promise<StandingRow[]> {
  const tabId = tabIdFromUrl(url);

  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; FKOlaineSite/1.0)",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch LFF standings: ${res.status}`);
  }

  const $ = cheerio.load(await res.text());
  const rows: StandingRow[] = [];

  // Some competitions (e.g. 1. līga) split the table into multiple groups
  // (1.-5. vieta, 6.-10. vieta, stage standings, ...) on the same tab —
  // only the first one is the group our teams actually sit in.
  const table = $(`#${tabId} .competitionTable`).first();

  table.find(".rankings .tr.row").each((_, el) => {
    const cells = $(el).children("div");
    const team = $(cells[1]).find("a").first().text().trim();

    rows.push({
      pos: toInt($(cells[0]).text()),
      team,
      logo: $(cells[1]).find("img").attr("src") ?? null,
      played: toInt($(cells[2]).text()),
      wins: toInt($(cells[3]).text()),
      draws: toInt($(cells[4]).text()),
      losses: toInt($(cells[5]).text()),
      goalsFor: toInt($(cells[6]).text()),
      goalsAgainst: toInt($(cells[7]).text()),
      goalDiff: toInt($(cells[8]).text()),
      points: toInt($(cells[9]).text()),
      isOlaine: /olaine/i.test(team),
    });
  });

  return rows;
}
