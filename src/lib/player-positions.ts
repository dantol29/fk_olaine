import * as cheerio from "cheerio";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db/client";
import { playerTeams, players } from "@/db/schema";
import { absoluteLffUrl, fetchLffHtml, normalizeLffText } from "@/lib/lff-fetch";

export type PlayerPosition = "goalkeeper" | "defender" | "midfielder" | "forward";
const POSITIONS: Record<string, PlayerPosition> = {
  "vārtsargi": "goalkeeper",
  "aizsargi": "defender",
  "pussargi": "midfielder",
  "uzbrucēji": "forward",
};

function normalizeName(value: string) {
  return normalizeLffText(value).normalize("NFC").toLocaleLowerCase("lv");
}

function normalizeBirthdate(value: string) {
  const match = value.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  return match ? `${Number(match[1])}.${Number(match[2])}.${match[3]}` : null;
}

export function parseLffPlayerPositions(html: string) {
  const $ = cheerio.load(html);
  const roster: { name: string; birthdate: string; position: PlayerPosition }[] = [];
  $(".playerslist.list").each((_, list) => {
    let position: PlayerPosition | null = null;
    $(list).find(".tr").each((_, element) => {
      const row = $(element);
      if (row.hasClass("th2")) {
        position = POSITIONS[normalizeName(row.text())] ?? null;
        return;
      }
      if (!row.hasClass("player") || !position) return;
      const name = normalizeLffText(row.find(".playerData .name").text());
      const birthdate = normalizeBirthdate(row.find(".description").text());
      if (name && birthdate) roster.push({ name, birthdate, position });
    });
  });
  return roster;
}

async function getRosterUrls(sourceUrl: string) {
  const url = new URL(sourceUrl);
  const html = await fetchLffHtml(sourceUrl, "player positions");
  if (url.pathname.startsWith("/klubi/")) return [{ url: sourceUrl, html }];
  const $ = cheerio.load(html);
  const tab = url.searchParams.get("tab");
  const requestedId = tab?.replace(/^content_/, "tabContent_");
  const requested = requestedId ? $("[id]").filter((_, node) => $(node).attr("id") === requestedId) : null;
  const clubLinks = (root: cheerio.Cheerio<import("domhandler").AnyNode>) => root.find('a[href*="/klubi/"]').filter((_, node) => /olaine/i.test($(node).text()));
  const selected = requested && requested.length ? clubLinks(requested) : null;
  const links = selected?.length ? selected : clubLinks($.root());
  const urls = new Set<string>();
  links.each((_, element) => {
    const link = absoluteLffUrl($(element).attr("href"), sourceUrl);
    if (!link) return;
    const rosterUrl = new URL(link);
    if (rosterUrl.protocol !== "https:" || !/(^|\.)lff\.lv$/i.test(rosterUrl.hostname) || !rosterUrl.pathname.startsWith("/klubi/")) return;
    rosterUrl.searchParams.delete("tab");
    rosterUrl.searchParams.delete("pg");
    urls.add(rosterUrl.href);
  });
  if (!urls.size) throw new Error("No FK Olaine roster link found on the LFF source page.");
  if (urls.size > 12) throw new Error("Too many LFF rosters found; configure a specific competition tab.");
  const rosters = [];
  for (const rosterUrl of urls) rosters.push({ url: rosterUrl, html: await fetchLffHtml(rosterUrl, "team roster") });
  return rosters;
}

export async function syncPlayerPositionsForSource(source: { teamId: number; url: string }) {
  const rosters = await getRosterUrls(source.url);
  const positionsByPlayer = new Map<string, Set<PlayerPosition>>();
  let fetched = 0;
  for (const roster of rosters) {
    for (const player of parseLffPlayerPositions(roster.html)) {
      const key = normalizeName(player.name);
      const positions = positionsByPlayer.get(key) ?? new Set<PlayerPosition>();
      positions.add(player.position);
      positionsByPlayer.set(key, positions);
      fetched++;
    }
  }
  if (!fetched) throw new Error("LFF roster did not contain player positions.");
  const teamPlayers = await db.select({ id: players.id, name: players.name, birthdate: players.birthdate, position: players.position })
    .from(playerTeams).innerJoin(players, eq(players.id, playerTeams.playerId)).where(eq(playerTeams.teamId, source.teamId));
  const nameCounts = new Map<string, number>();
  for (const player of teamPlayers) {
    const name = normalizeName(player.name);
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  }
  let updated = 0;
  let matched = 0;
  let conflicts = 0;
  for (const player of teamPlayers) {
    const candidates = positionsByPlayer.get(normalizeName(player.name));
    if (!candidates) continue;
    if (candidates.size !== 1 || nameCounts.get(normalizeName(player.name)) !== 1) { conflicts++; continue; }
    matched++;
    const position = [...candidates][0];
    // Fill missing positions without overwriting an admin's existing selection.
    if (player.position == null) {
      const changed = await db.update(players).set({ position }).where(and(eq(players.id, player.id), isNull(players.position))).returning({ id: players.id });
      updated += changed.length;
    }
  }
  return { updated, matched, conflicts, fetched, unmatched: teamPlayers.length - matched - conflicts };
}
