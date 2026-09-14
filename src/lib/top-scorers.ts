import * as cheerio from "cheerio";

import { absoluteLffUrl, fetchLffHtml, normalizeLffText } from "@/lib/lff-fetch";

export type ScrapedScorer = {
  rank: number;
  name: string;
  photoUrl: string | null;
  club: string;
  clubLogo: string | null;
  goals: number;
  isOlaine: boolean;
};

export function parseTopScorersHtml(html: string, pageUrl: string): ScrapedScorer[] {
  const $ = cheerio.load(html);
  const rows = $(".goalscorers .tr").toArray();

  const result: ScrapedScorer[] = [];
  for (const el of rows) {
    const row = $(el);
    const cells = row.children("div").toArray();
    if (cells.length < 4) continue;

    const rank = Number(normalizeLffText($(cells[0]).text()));
    const name = normalizeLffText($(cells[1]).find("span").first().text());
    const photoUrl = absoluteLffUrl($(cells[1]).find("img").attr("src"), pageUrl);
    const club = normalizeLffText($(cells[2]).find("span").first().text());
    const clubLogo = absoluteLffUrl($(cells[2]).find("img").attr("src"), pageUrl);
    const goals = Number(normalizeLffText($(cells[3]).text()));

    if (!Number.isFinite(rank) || !name || !club || !Number.isFinite(goals)) continue;

    result.push({ rank, name, photoUrl, club, clubLogo, goals, isOlaine: /olaine/i.test(club) });
  }

  if (result.length === 0) {
    throw new Error("LFF top scorers layout was not recognized (no .goalscorers .tr rows found)");
  }
  return result;
}

export async function getTopScorers(url: string): Promise<ScrapedScorer[]> {
  return parseTopScorersHtml(await fetchLffHtml(url, "top scorers"), url);
}
