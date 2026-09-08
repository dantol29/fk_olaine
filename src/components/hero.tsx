import { gte } from "drizzle-orm";

import { db } from "@/db/client";
import { games } from "@/db/schema";
import { toDateKey } from "@/lib/calendar";
import { getStandings, type StandingRow } from "@/lib/standings";
import { isOlaine, type Team, type UpcomingGame } from "@/lib/games";
import { LeagueSelector } from "@/components/league-selector";
import { MatchesShowcase } from "@/components/matches-showcase";
import { WideScreenFillers } from "@/components/wide-screen-fillers";

const FALLBACK_STANDINGS: StandingRow[] = [
  {
    pos: 1,
    team: "RFS Women",
    logo: null,
    played: 17,
    wins: 15,
    draws: 0,
    losses: 2,
    goalsFor: 98,
    goalsAgainst: 10,
    goalDiff: 88,
    points: 45,
    isOlaine: false,
  },
  {
    pos: 4,
    team: "FK Iecava/FK Olaine",
    logo: null,
    played: 17,
    wins: 7,
    draws: 0,
    losses: 10,
    goalsFor: 49,
    goalsAgainst: 55,
    goalDiff: -6,
    points: 21,
    isOlaine: true,
  },
];

const FALLBACK_UPCOMING_GAMES: UpcomingGame[] = [
  {
    day: "07",
    month: "SEP",
    year: "2026",
    weekday: "PIRMD.",
    time: "16:00",
    home: { name: "FK Olaine", logo: "/fk-olaine-crest-v2.png" },
    away: { name: "RFS Women", initials: "RFS", color: "bg-[#173f8a]" },
    venue: "RFS stadions",
    league: "Sieviešu līga",
  },
  {
    day: "14",
    month: "SEP",
    year: "2026",
    weekday: "PIRMD.",
    time: "14:00",
    home: { name: "Liepājas FS", initials: "LFS", color: "bg-[#167c4c]" },
    away: { name: "FK Olaine", logo: "/fk-olaine-crest-v2.png" },
    venue: "Liepājas stadions",
    league: "Sieviešu līga",
  },
  {
    day: "21",
    month: "SEP",
    year: "2026",
    weekday: "PIRMD.",
    time: "15:00",
    home: { name: "FK Olaine", logo: "/fk-olaine-crest-v2.png" },
    away: {
      name: "Riga FC Women",
      initials: "RFC",
      color: "bg-[#1687c9]",
    },
    venue: "Olaines stadions",
    league: "Sieviešu līga",
  },
];

const WEEKDAY_ABBR: Record<string, string> = {
  pirmdiena: "PIRMD.",
  otrdiena: "OTRD.",
  trešdiena: "TREŠD.",
  ceturtdiena: "CETURTD.",
  piektdiena: "PIEKTD.",
  sestdiena: "SESTD.",
  svētdiena: "SVĒTD.",
};

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAI",
  "JŪN",
  "JŪL",
  "AUG",
  "SEP",
  "OKT",
  "NOV",
  "DEC",
];

const FALLBACK_TEAM_COLORS = [
  "bg-club-navy",
  "bg-club-red",
  "bg-[#167c4c]",
  "bg-[#1687c9]",
  "bg-[#7c3aed]",
];

function initialsFor(name: string) {
  return name
    .split(/[\s/]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function colorFor(name: string) {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) % FALLBACK_TEAM_COLORS.length;
  }
  return FALLBACK_TEAM_COLORS[hash];
}

function teamDisplay(name: string): Team {
  return isOlaine(name)
    ? { name, logo: "/fk-olaine-crest-v2.png" }
    : { name, initials: initialsFor(name), color: colorFor(name) };
}

function weekdayAbbrFor(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12));
  const weekday = new Intl.DateTimeFormat("lv-LV", {
    timeZone: "Europe/Riga",
    weekday: "long",
  })
    .format(noonUtc)
    .toLowerCase();
  return WEEKDAY_ABBR[weekday] ?? "";
}

async function fetchStandings(
  competition: Parameters<typeof getStandings>[0],
  fallback: StandingRow[] = [],
): Promise<StandingRow[]> {
  try {
    return await getStandings(competition);
  } catch {
    return fallback;
  }
}

async function fetchUpcomingGames(): Promise<UpcomingGame[]> {
  try {
    const todayKey = toDateKey(new Date());
    const rows = await db
      .select()
      .from(games)
      .where(gte(games.date, todayKey))
      .orderBy(games.date, games.startTime)
      .limit(5);

    if (rows.length === 0) return FALLBACK_UPCOMING_GAMES;

    return rows.map((row) => {
      const [year, month, day] = row.date.split("-").map(Number);
      return {
        day: String(day).padStart(2, "0"),
        month: MONTHS[month - 1] ?? "",
        year: String(year),
        weekday: weekdayAbbrFor(row.date),
        time: row.startTime,
        league: row.league ?? "Draudzības spēle",
        home: teamDisplay(row.homeTeam),
        away: teamDisplay(row.awayTeam),
        venue: row.location,
      };
    });
  } catch {
    return FALLBACK_UPCOMING_GAMES;
  }
}

export async function Hero() {
  const [sieviesuLiga, liga1, u16, upcomingGames] = await Promise.all([
    fetchStandings("sieviesu-liga", FALLBACK_STANDINGS),
    fetchStandings("1-liga"),
    fetchStandings("u16"),
    fetchUpcomingGames(),
  ]);

  return (
    <section className="px-6 pt-2 pb-3 sm:pt-3">
      <div className="relative mx-auto max-w-[1440px]">
        <WideScreenFillers />

        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Left column: full-height matches showcase */}
          <MatchesShowcase games={upcomingGames} />

          {/* League table card */}
          <div className="relative flex h-[640px] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-background shadow-sm">
            <LeagueSelector leagues={[sieviesuLiga, liga1, u16]} />
          </div>
        </div>
      </div>
    </section>
  );
}
