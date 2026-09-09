export type Team = {
  name: string;
  logo?: string;
  initials?: string;
  color?: string;
};

export type UpcomingGame = {
  /** The games-table row id — used to deep-link to this game's entry in
   *  the homepage calendar (see MatchesShowcase / WeekCalendar's "event"
   *  URL param). Fallback/placeholder games use a negative id that will
   *  never match a real calendar event. */
  id: number;
  day: string;
  month: string;
  year: string;
  weekday: string;
  time: string;
  home: Team;
  away: Team;
  venue: string;
  league: string;
};

export function isOlaine(name: string) {
  return /olaine/i.test(name);
}

export const MONTHS = [
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

export function gameDate(game: UpcomingGame): Date {
  const monthIndex = MONTHS.indexOf(game.month);
  const [hours, minutes] = game.time.split(":").map(Number);
  return new Date(
    Number(game.year),
    monthIndex >= 0 ? monthIndex : 0,
    Number(game.day),
    hours || 0,
    minutes || 0,
  );
}

const FALLBACK_TEAM_COLORS = [
  "bg-club-navy",
  "bg-club-red",
  "bg-[#167c4c]",
  "bg-[#1687c9]",
  "bg-[#7c3aed]",
];

/** Two-letter (or two-word-initial) fallback badge text for a club with no
 *  logo on file. */
export function initialsFor(name: string) {
  return name
    .split(/[\s/]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/** A stable, deterministic Tailwind background color for a club's fallback
 *  initials badge, so the same name always gets the same color. */
export function colorFor(name: string) {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) % FALLBACK_TEAM_COLORS.length;
  }
  return FALLBACK_TEAM_COLORS[hash];
}
