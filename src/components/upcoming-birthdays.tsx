import Image from "next/image";
import { UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { getUpcomingBirthdays } from "@/lib/birthdays-server";

/** Compact "Dzimšanas dienas" list for narrow sidebar columns (currently
 *  /treninji, under the month calendar) — the homepage's own carousel
 *  (birthdays-carousel.tsx) needs the full page width, so this is a
 *  separate, simpler presentation of the same data. */
export async function UpcomingBirthdays({ className }: { className?: string } = {}) {
  const birthdays = await getUpcomingBirthdays(3);
  if (birthdays.length === 0) return null;

  return (
    <div
      className={cn(
        "pt-4 pr-4 pb-4 pl-4 sm:rounded-2xl sm:bg-white sm:pt-8 sm:pr-5 sm:pb-5 sm:pl-8",
        className,
      )}
    >
      <h3 className="text-3xl tracking-[-0.02em] text-club-navy sm:text-4xl">
        Dzimšanas dienas
      </h3>

      <div className="mt-4 flex flex-col divide-y divide-slate-100">
        {birthdays.map((player) => {
          const isToday = player.daysUntil === 0;
          return (
            <div
              key={player.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4"
            >
              <div
                className={cn(
                  "relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-club-gray-light sm:h-16 sm:w-16",
                  isToday && "ring-2 ring-club-red/40",
                )}
              >
                {player.photoUrl ? (
                  <Image src={player.photoUrl} alt={player.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserRound className="h-6 w-6 text-club-muted" strokeWidth={1.5} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-club-navy">{player.name}</p>
                {player.teamName && (
                  <p className="truncate text-xs text-slate-400">{player.teamName}</p>
                )}
              </div>

              {player.daysUntil === 0 ? (
                <span className="shrink-0 rounded-full bg-club-red px-2.5 py-1 text-xs font-semibold text-white">
                  Šodien!
                </span>
              ) : (
                <span className="shrink-0 text-sm font-semibold text-club-navy">
                  {String(player.birthDay).padStart(2, "0")}.{String(player.birthMonth).padStart(2, "0")}.
                  {player.birthYear}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
