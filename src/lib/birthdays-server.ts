import "server-only";

import { db } from "@/db/client";

export type UpcomingBirthday = {
  id: number;
  name: string;
  photoUrl: string | null;
  teamName: string | null;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
  turningAge: number;
  /** 0 = today. */
  daysUntil: number;
};

export type BirthdaysTimeline = {
  /** Most recently passed first (closest to today) → left of center. */
  past: UpcomingBirthday[];
  /** Today's birthday, or otherwise whoever's is soonest. */
  center: UpcomingBirthday | null;
  /** Soonest first → right of center. */
  future: UpcomingBirthday[];
};

/** Days (and the resulting age) until this player's next birthday,
 *  counting from `today` — wraps to next year once this year's date has
 *  already passed. All-UTC math so it never shifts with server timezone.
 *  Players are entered as free-text "DD.MM.GGGG." (see the admin player
 *  form) rather than an ISO date, so this parses that shape directly and
 *  returns null for anything that doesn't match instead of producing
 *  NaN/undefined output. */
function nextBirthday(birthdate: string, today: Date) {
  const [dayStr, monthStr, yearStr] = birthdate.split(".").filter(Boolean);
  const day = Number(dayStr);
  const month = Number(monthStr);
  const birthYear = Number(yearStr);
  if (!day || !month || !birthYear) return null;

  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  let next = Date.UTC(today.getUTCFullYear(), month - 1, day);
  if (next < todayUtc) {
    next = Date.UTC(today.getUTCFullYear() + 1, month - 1, day);
  }

  return {
    daysUntil: Math.round((next - todayUtc) / 86_400_000),
    turningAge: new Date(next).getUTCFullYear() - birthYear,
    month,
    day,
    year: birthYear,
  };
}

/** A left-to-right timeline for the homepage's "Dzimšanas dienas" section:
 *  the soonest birthday (today's, if any) sits in the `center`, the most
 *  recently *passed* ones trail off to the left in `past`, and the next
 *  ones after center lead off to the right in `future`. Built from one
 *  sorted-by-days-until list: the tail of that list (largest daysUntil,
 *  i.e. "almost a full year away") is exactly the most recently passed
 *  birthdays, so no separate past/future query is needed. */
export async function getBirthdaysTimeline(sideCount = 4): Promise<BirthdaysTimeline> {
  const rows = await db.query.players.findMany({
    with: { playerTeams: { with: { team: true } } },
  });

  const today = new Date();
  const all = rows
    .map((player): UpcomingBirthday | null => {
      const parsed = nextBirthday(player.birthdate, today);
      if (!parsed) return null;
      return {
        id: player.id,
        name: player.name,
        photoUrl: player.photoUrl,
        teamName: player.playerTeams[0]?.team.name ?? null,
        birthDay: parsed.day,
        birthMonth: parsed.month,
        birthYear: parsed.year,
        turningAge: parsed.turningAge,
        daysUntil: parsed.daysUntil,
      };
    })
    .filter((player) => player !== null)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  if (all.length === 0) return { past: [], center: null, future: [] };

  const center = all[0];
  const rest = all.slice(1);
  const future = rest.slice(0, sideCount);
  const remaining = rest.slice(future.length);
  const past = remaining.slice(Math.max(0, remaining.length - sideCount));

  return { past, center, future };
}
