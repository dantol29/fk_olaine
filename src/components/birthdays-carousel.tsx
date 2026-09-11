import Image from "next/image";
import { UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BirthdaysTimeline, UpcomingBirthday } from "@/lib/birthdays-server";

function BirthdayCard({
  player,
  center = false,
  hideOnMobile = false,
}: {
  player: UpcomingBirthday;
  center?: boolean;
  hideOnMobile?: boolean;
}) {
  const isToday = player.daysUntil === 0;
  const day = String(player.birthDay).padStart(2, "0");
  const month = String(player.birthMonth).padStart(2, "0");

  return (
    <div
      className={cn(
        "min-w-0 basis-0 flex-col overflow-hidden rounded-2xl sm:shrink-0 sm:grow-0 sm:basis-auto",
        hideOnMobile ? "hidden sm:flex" : "flex",
        center
          ? "z-10 h-44 grow-[1.15] border-club-red/30 shadow-lg sm:h-64 sm:w-[170px] lg:h-80 lg:w-[210px]"
          : "h-36 grow border-slate-200 opacity-80 sm:h-52 sm:w-[130px] lg:h-64 lg:w-[160px]",
      )}
    >
      <div className="relative h-[60%] w-full shrink-0 bg-club-gray-light sm:h-[80%]">
        {player.photoUrl ? (
          <Image src={player.photoUrl} alt={player.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UserRound
              className={cn(
                "text-club-muted",
                center ? "h-10 w-10 sm:h-14 sm:w-14" : "h-8 w-8 sm:h-10 sm:w-10",
              )}
              strokeWidth={1.5}
            />
          </div>
        )}
        {isToday && (
          <span className="absolute top-2 left-2 rounded-full bg-club-red px-2 py-0.5 text-[10px] font-semibold text-white">
            Šodien!
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-0.5 bg-white px-1 text-center sm:px-2">
        <p
          className={cn(
            "w-full truncate font-semibold text-club-navy",
            center ? "text-base" : "text-sm",
          )}
        >
          {player.name}
        </p>
        <p className={cn("text-slate-400", center ? "text-sm" : "text-xs")}>
          {day}.{month}.{player.birthYear}.
        </p>
      </div>
    </div>
  );
}

export function BirthdaysCarousel({ past, center, future }: BirthdaysTimeline) {
  if (!center) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-4 sm:gap-4 sm:px-2">
      {past.map((player, index) => (
        <BirthdayCard
          key={player.id}
          player={player}
          hideOnMobile={index !== past.length - 1}
        />
      ))}
      <BirthdayCard player={center} center />
      {future.map((player, index) => (
        <BirthdayCard key={player.id} player={player} hideOnMobile={index !== 0} />
      ))}
    </div>
  );
}
