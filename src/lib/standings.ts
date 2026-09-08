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

export type Competition = "sieviesu-liga" | "1-liga" | "u16";

const COMPETITIONS: Record<Competition, { url: string; tabId: string }> = {
  "sieviesu-liga": {
    url: "https://lff.lv/sacensibas/sievietes/sieviesu-futbola-liga/?tab=content_1_4",
    tabId: "tabContent_1_4",
  },
  "1-liga": {
    url: "https://lff.lv/sacensibas/sievietes/sieviesu-futbola-1-liga/?tab=content_1_6",
    tabId: "tabContent_1_6",
  },
  u16: {
    url: "https://lff.lv/sacensibas/sievietes/meitenu-cempionats/?tab=content_1_4",
    tabId: "tabContent_1_4",
  },
};

function toInt(value: string) {
  return parseInt(value.replace("+", "").trim(), 10);
}

export async function getStandings(
  competition: Competition = "sieviesu-liga"
): Promise<StandingRow[]> {
  const { url, tabId } = COMPETITIONS[competition];

  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; FKOlaineSite/1.0)",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch LFF standings (${competition}): ${res.status}`);
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
