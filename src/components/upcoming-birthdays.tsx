import Image from "next/image";
import { UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { getUpcomingBirthdays } from "@/lib/birthdays-server";

const birthdayMonths = ["jan.", "feb.", "mar.", "apr.", "mai.", "jūn.", "jūl.", "aug.", "sep.", "okt.", "nov.", "dec."];

export async function UpcomingBirthdays({ className }: { className?: string } = {}) {
  const birthdays = await getUpcomingBirthdays(3);
  if (birthdays.length === 0) return null;

  return (
    <section aria-labelledby="upcoming-birthdays-heading" className={cn("h-full bg-white text-black", className)}>
      <div className="flex items-end justify-between gap-4 border-b-2 border-black pb-5">
        <h3 id="upcoming-birthdays-heading" className="text-2xl font-semibold uppercase sm:text-3xl">Dzimšanas dienas</h3>
      </div>
      <ul className="divide-y divide-black/10">
        {birthdays.map((player) => {
          const isToday = player.daysUntil === 0;
          return (
            <li key={player.id} className="flex items-center gap-3 py-6 sm:gap-5">
              <div className={cn("flex h-24 w-16 shrink-0 flex-col items-center justify-center sm:h-28 sm:w-20", isToday ? "bg-club-red text-white" : "bg-[#f5f5f5] text-black")}>
                <span className="text-3xl leading-none font-semibold tabular-nums sm:text-4xl">{String(player.birthDay).padStart(2, "0")}</span>
                <span className="mt-2 text-xs uppercase">{birthdayMonths[player.birthMonth - 1]}</span>
              </div>
              <div className="relative h-24 w-16 shrink-0 overflow-hidden bg-[#f5f5f5] sm:h-28 sm:w-20">
                {player.photoUrl ? <Image src={player.photoUrl} alt="" fill sizes="80px" className="object-contain object-bottom" /> : <div className="flex h-full items-center justify-center"><UserRound className="size-8 text-black/20" strokeWidth={1} /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base leading-tight font-semibold sm:text-xl">{player.name}</p>
                {player.teamName && <p className="mt-2 text-xs text-black/45">{player.teamName}</p>}
                <p className={cn("mt-2 text-xs", isToday ? "font-semibold text-club-red" : "text-black/45")}>
                  {isToday ? "Sveicam dzimšanas dienā!" : player.daysUntil === 1 ? "Rīt" : `Pēc ${player.daysUntil} dienām`}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
