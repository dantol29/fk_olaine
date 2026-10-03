import Image from "next/image";
import { UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { getUpcomingBirthdays } from "@/lib/birthdays-server";

const birthdayMonths = ["jan.", "feb.", "mar.", "apr.", "mai.", "jūn.", "jūl.", "aug.", "sep.", "okt.", "nov.", "dec."];

export async function UpcomingBirthdays({ className }: { className?: string } = {}) {
  const birthdays = await getUpcomingBirthdays(3);
  if (birthdays.length === 0) return null;

  return (
    <div
      className={cn(
        "h-full bg-[#f5f5f5] p-6 text-black sm:p-8",
        className,
      )}
    >
      <h3 className="text-2xl font-semibold uppercase sm:text-3xl">
        Dzimšanas dienas
      </h3>

      <div className="mt-6 flex flex-col divide-y divide-black/10">
        {birthdays.map((player) => {
          const isToday = player.daysUntil === 0;
          return (
            <div
              key={player.id}
              className="flex items-center gap-3 py-5 sm:gap-4"
            >
              <div className={cn("w-12 shrink-0 text-center", isToday && "text-club-red")}>
                <span className="block text-3xl font-semibold leading-none tabular-nums sm:text-4xl">{String(player.birthDay).padStart(2, "0")}</span>
                <span className="mt-1 block text-xs uppercase">{birthdayMonths[player.birthMonth - 1]}</span>
              </div>
              <div
                className="relative size-14 shrink-0 overflow-hidden bg-white sm:size-16"
              >
                {player.photoUrl ? (
                  <Image
                    src={player.photoUrl}
                    alt={player.name}
                    fill
                    sizes="(min-width: 640px) 64px, 56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserRound className="h-9 w-9 text-club-muted" strokeWidth={1.5} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold leading-snug sm:text-lg">{player.name}</p>
                {player.teamName && (
                  <p className="mt-0.5 text-xs text-black/50 sm:text-sm">{player.teamName}</p>
                )}
                <p className={cn("mt-1 text-xs", isToday ? "font-semibold text-club-red" : "text-black/50")}>
                  {isToday ? "Šodien!" : player.daysUntil === 1 ? "Rīt" : `Pēc ${player.daysUntil} dienām`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
