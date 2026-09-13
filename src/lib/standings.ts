import * as cheerio from "cheerio";
import type { Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";

import { absoluteLffUrl, fetchLffHtml, normalizeLffText } from "@/lib/lff-fetch";

export type StandingRow = {
  pos: number; team: string; logo: string | null; played: number; wins: number;
  draws: number; losses: number; goalsFor: number; goalsAgainst: number;
  goalDiff: number; points: number; isOlaine: boolean;
};

function integer(value: string): number | null {
  const match = normalizeLffText(value).replace(/\u2212/g, "-").match(/[+-]?\d+/);
  if (!match) return null;
  const result = Number(match[0]);
  return Number.isSafeInteger(result) ? result : null;
}

function requestedTabSelector(url: string): string | null {
  const tab = new URL(url).searchParams.get("tab");
  return tab ? `#tab${tab.charAt(0).toUpperCase()}${tab.slice(1)}` : null;
}

function parseTable($: cheerio.CheerioAPI, table: Cheerio<AnyNode>, pageUrl: string): StandingRow[] {
  let candidates: AnyNode[] = table.find(".rankings .tr.row, tbody tr, [class*=ranking] .row").toArray();
  if (candidates.length === 0) {
    candidates = table.find('a[href*="/klubi/"]').map((_, link) =>
      $(link).closest(".tr, tr, li").get(0),
    ).get();
  }

  const result: StandingRow[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const row = $(candidate);
    const teamLink = row.find('a[href*="/klubi/"]').first();
    const teamCell = teamLink.closest("div, td");
    const team = normalizeLffText(teamLink.text() || teamCell.find("[class*=name], .title").first().text());
    const teamKey = team.toLocaleLowerCase("lv");
    if (!team || seen.has(teamKey)) continue;

    const cells = row.children("div, td").toArray();
    const teamIndex = cells.findIndex((cell) => cell === teamCell.get(0));
    const pos = integer($(cells[0]).text());
    const values = cells.slice(teamIndex >= 0 ? teamIndex + 1 : 2)
      .map((cell) => integer($(cell).text()))
      .filter((value): value is number => value !== null);
    if (pos === null || values.length < 8) continue;

    seen.add(teamKey);
    const image = teamCell.find("img").first();
    result.push({
      pos, team,
      logo: absoluteLffUrl(image.attr("src") ?? image.attr("data-src"), pageUrl),
      played: values[0], wins: values[1], draws: values[2], losses: values[3],
      goalsFor: values[4], goalsAgainst: values[5], goalDiff: values[6], points: values[7],
      isOlaine: /olaine/i.test(team),
    });
  }
  return result;
}

export function parseStandingsHtml(html: string, pageUrl: string): StandingRow[] {
  const $ = cheerio.load(html);
  const requestedTab = requestedTabSelector(pageUrl);
  const scope = requestedTab && $(requestedTab).length ? $(requestedTab) : $.root();
  let tables = scope.find(".competitionTable, table").toArray();
  if (tables.length === 0 && scope.find(".rankings").length) tables = scope.find(".rankings").toArray();

  const parsed = tables.map((table) => parseTable($, $(table), pageUrl)).filter((rows) => rows.length);
  const standings = parsed.find((rows) => rows.some((row) => row.isOlaine)) ?? parsed[0];
  if (!standings) {
    throw new Error(`LFF standings layout was not recognized (tables=${tables.length}, club links=${scope.find('a[href*="/klubi/"]').length}, requested tab=${requestedTab ?? "none"})`);
  }
  return standings;
}

export async function getStandings(url: string): Promise<StandingRow[]> {
  return parseStandingsHtml(await fetchLffHtml(url, "standings"), url);
}
