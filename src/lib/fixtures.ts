import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

import { absoluteLffUrl, fetchLffHtml, normalizeLffText } from "@/lib/lff-fetch";

export type ScrapedFixture = {
  date: string;
  time: string | null;
  home: string;
  away: string;
  homeLogo: string | null;
  awayLogo: string | null;
  stadium: string;
  played: boolean;
};

const MONTHS: Record<string, number> = {
  jan: 1, janvaris: 1, feb: 2, februaris: 2, mar: 3, marts: 3,
  apr: 4, aprilis: 4, mai: 5, maijs: 5, jun: 6, junijs: 6,
  jul: 7, julijs: 7, aug: 8, augusts: 8, sep: 9, septembris: 9,
  okt: 10, oktobris: 10, nov: 11, novembris: 11, dec: 12, decembris: 12,
};

function plain(value: string) {
  return normalizeLffText(value).toLocaleLowerCase("lv").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function validDate(year: number, month: number, day: number): string | null {
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDateText(value: string, fallbackYear: number | null): string | null {
  const text = plain(value);
  let match = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (match) return validDate(Number(match[1]), Number(match[2]), Number(match[3]));
  match = text.match(/\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/);
  if (match) return validDate(Number(match[3]), Number(match[2]), Number(match[1]));
  match = text.match(/\b(\d{1,2})\s+([a-z]+)\.?\s*(20\d{2})?\b/);
  if (!match) return null;
  const month = MONTHS[match[2].replace(/\./g, "")];
  const year = match[3] ? Number(match[3]) : fallbackYear;
  return month && year ? validDate(year, month, Number(match[1])) : null;
}

function parseTime(value: string): string | null {
  const match = normalizeLffText(value).match(/(?:^|\s)([01]?\d|2[0-3])[:.]([0-5]\d)(?:\s|$)/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : null;
}

function tabSelector(url: string): string | null {
  const tab = new URL(url).searchParams.get("tab");
  return tab ? `#tab${tab.charAt(0).toUpperCase()}${tab.slice(1)}` : null;
}

export function parseFixturesHtml(html: string, pageUrl: string): ScrapedFixture[] {
  const $ = cheerio.load(html);
  const requestedTab = tabSelector(pageUrl);
  const scope = requestedTab && $(requestedTab).length ? $(requestedTab) : $.root();
  const fallbackYear = Number($(".pageSelect option[selected], .pageSelect option:selected").first().text().match(/20\d{2}/)?.[0]) || Number($("h1, title").text().match(/20\d{2}/)?.[0]) || null;

  let candidates: AnyNode[] = scope.find(".tr.match, [data-id].match, [data-match-id]").toArray();
  if (candidates.length === 0) {
    candidates = scope.find('a[href*="/speles/"]').map((_, link) => $(link).closest(".tr, article, li, tr").get(0)).get();
  }

  const fixtures: ScrapedFixture[] = [];
  const seen = new Set<string>();
  for (const element of candidates) {
    const row = $(element);
    let clubNodes: AnyNode[] = row.find(".club").toArray();
    if (clubNodes.length < 2) {
      clubNodes = row.find('a[href*="/klubi/"]').slice(0, 2).map((_, link) => $(link).closest(".club, [class*=team], td").get(0) ?? link).get();
    }
    if (clubNodes.length < 2) continue;

    const clubs = clubNodes.slice(0, 2).map((club) => {
      const node = $(club);
      const link = node.find('a[href*="/klubi/"]').first();
      const name = normalizeLffText(link.text() || node.find(".title, [class*=name]").first().text());
      const image = node.find("img").first();
      const logo = absoluteLffUrl(image.attr("src") ?? image.attr("data-src"), pageUrl);
      const scoreText = normalizeLffText(node.find(".result, [class*=score]").first().text());
      return { name, logo, score: scoreText.match(/\d+/)?.[0] ?? null };
    });
    if (!clubs[0].name || !clubs[1].name) continue;

    const dateNode = row.find(".date, [class*=date]").first();
    const structuredDate = dateNode.length
      ? validDate(Number(dateNode.find(".h8, [class*=year]").first().text()), MONTHS[plain(dateNode.find("h6, [class*=month]").first().text()).replace(/\./g, "")] ?? 0, Number(dateNode.find("h5, [class*=day]").first().text()))
      : null;
    const dataDate = row.attr("data-date") ?? row.find("[data-date]").first().attr("data-date") ?? "";
    const nearbyHeading = row.prevAll(".th1, [class*=heading]").first().text();
    const date = structuredDate || parseDateText(dataDate, fallbackYear) || parseDateText(dateNode.text(), fallbackYear) || parseDateText(nearbyHeading, fallbackYear) || parseDateText(row.text(), fallbackYear);
    if (!date) continue;

    const time = parseTime(row.attr("data-time") ?? "") || parseTime(dateNode.find(".h7, time, [class*=time]").first().text()) || parseTime(row.find("time, [class*=time], .matchday h4").first().text());
    const stadium = normalizeLffText(row.find(".stadium, [class*=stadium], [class*=venue], [class*=location]").first().text());
    const key = `${date}|${time ?? ""}|${clubs[0].name}|${clubs[1].name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    fixtures.push({ date, time, home: clubs[0].name, away: clubs[1].name, homeLogo: clubs[0].logo, awayLogo: clubs[1].logo, stadium, played: clubs[0].score !== null && clubs[1].score !== null });
  }

  if (fixtures.length === 0) {
    throw new Error(`LFF fixtures layout was not recognized (matches=${candidates.length}, club links=${scope.find('a[href*="/klubi/"]').length}, requested tab=${requestedTab ?? "none"})`);
  }
  return fixtures;
}

export async function scrapeFixtures(url: string): Promise<ScrapedFixture[]> {
  return parseFixturesHtml(await fetchLffHtml(url, "fixtures"), url);
}
