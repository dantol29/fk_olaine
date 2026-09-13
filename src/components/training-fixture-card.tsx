import Image from "next/image";
import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TrainingListItem } from "@/lib/trainings-server";

export function CoachAvatars({
  coaches,
  avatarClassName,
}: {
  coaches: TrainingListItem["coaches"];
  avatarClassName: string;
}) {
  return (
    <div className="flex -space-x-2">
      {coaches.map((coach) =>
        coach.photoUrl ? (
          <Image
            key={coach.name}
            src={coach.photoUrl}
            alt={coach.name}
            width={32}
            height={32}
            className={cn("shrink-0 rounded-full object-cover ring-2 ring-white", avatarClassName)}
          />
        ) : (
          <span
            key={coach.name}
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full bg-club-navy font-bold text-white ring-2 ring-white",
              avatarClassName,
            )}
          >
            {coach.name
              .split(" ")
              .map((word) => word[0])
              .join("")}
          </span>
        ),
      )}
    </div>
  );
}

/** The stacked mobile fixture card — shared by the plain fixture list (wrapped
 *  with `sm:hidden` there) and, always visible regardless of breakpoint, the
 *  month calendar's day-detail modal. Lives in its own file so both
 *  trainings-directory.tsx and trainings-month-calendar.tsx can import it
 *  without a circular dependency between the two. */
export function TrainingFixtureCard({
  training,
  dimPast = true,
}: {
  training: TrainingListItem;
  /** Fade the card when the training is in the past — on by default for the
   *  plain fixture list, turned off when a viewer explicitly opened this
   *  specific day (e.g. the month calendar's day-detail modal). */
  dimPast?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-2 px-4 py-5", dimPast && training.isPast && "opacity-50")}>
      <div className="flex items-start justify-between gap-2">
        <div className="leading-none text-slate-600">
          <span className="text-2xl font-extrabold">{training.day}</span>
          <span className="ml-1.5 text-xs font-semibold uppercase">{training.month}</span>
        </div>

        <div className="flex min-w-0 items-center gap-1.5 text-right text-xs text-slate-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="max-w-[160px] truncate">{training.location}</span>
        </div>
      </div>

      <div className="mt-1 flex flex-col items-center gap-1.5">
        <span className="max-w-[140px] truncate rounded-full bg-slate-100 px-4 py-2 text-sm text-club-navy">
          {training.teamName}
        </span>
        <span className="text-2xl font-extrabold text-club-navy">
          {training.startTime} – {training.endTime}
        </span>

        {training.coaches.length > 0 && (
          <div className="mt-0.5 flex items-center gap-2">
            <CoachAvatars coaches={training.coaches} avatarClassName="h-6 w-6 text-[9px]" />
            <span className="max-w-[180px] truncate text-xs text-slate-400">
              {training.coaches.map((coach) => coach.name).join(", ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
