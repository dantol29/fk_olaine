import Image from "next/image";
import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Team } from "@/lib/games";
import type { GameListItem } from "@/lib/games-server";

export function TeamLogo({ team, className }: { team: Team; className?: string }) {
  return team.logo ? (
    <Image
      src={team.logo}
      alt={team.name}
      width={56}
      height={56}
      className={cn(
        "shrink-0 rounded-full bg-white object-contain ring-1 ring-black/5",
        className ?? "h-9 w-9 sm:h-11 sm:w-11",
      )}
    />
  ) : (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white",
        team.color ?? "bg-club-navy",
        className ?? "h-9 w-9 sm:h-11 sm:w-11",
      )}
    >
      {team.initials ?? team.name.slice(0, 3).toUpperCase()}
    </span>
  );
}

/** The stacked mobile fixture card — shared by the plain fixture list (wrapped
 *  with `sm:hidden` there) and, always visible regardless of breakpoint, the
 *  month calendar's day-detail modal. Lives in its own file so both
 *  games-directory.tsx and games-month-calendar.tsx can import it without a
 *  circular dependency between the two. */
export function GameFixtureCard({
  game,
  dimPast = true,
}: {
  game: GameListItem;
  /** Fade the card when the game is in the past — on by default for the
   *  plain fixture list, turned off when a viewer explicitly opened this
   *  specific day (e.g. the month calendar's day-detail modal), where
   *  dimming a game they just asked to see reads as a rendering glitch. */
  dimPast?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 px-4 py-6", dimPast && game.isPast && "opacity-50")}>
      <div className="flex w-full items-start justify-between gap-2">
        <div className="leading-none text-slate-600">
          <span className="text-2xl font-extrabold">{game.day}</span>
          <span className="ml-1.5 text-xs font-semibold uppercase">{game.month}</span>
        </div>

        <div className="flex max-w-[65%] min-w-0 items-start gap-1.5 text-right text-xs text-slate-400">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 line-clamp-2">{game.venue}</span>
        </div>
      </div>

      <div className="mt-2 flex w-full items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <TeamLogo team={game.home} className="h-20 w-20" />
          <span className="min-w-0 line-clamp-2 text-center text-base leading-tight font-semibold text-club-navy uppercase">
            {game.home.name}
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1.5 pt-1">
          <span className="max-w-[140px] truncate rounded-full bg-slate-100 px-4 py-2 text-sm text-club-navy">
            {game.league}
          </span>
          <span className="text-2xl font-extrabold text-club-navy">{game.time}</span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <TeamLogo team={game.away} className="h-20 w-20" />
          <span className="min-w-0 line-clamp-2 text-center text-base leading-tight font-semibold text-club-navy uppercase">
            {game.away.name}
          </span>
        </div>
      </div>
    </div>
  );
}
