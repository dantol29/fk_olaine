import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { getAllTrainingsFromDb, type TrainingListItem } from "@/lib/trainings-server";
import { CoachAvatars, TrainingFixtureCard } from "@/components/training-fixture-card";
import { TrainingsMonthCalendar } from "@/components/trainings-month-calendar";

/** Mirrors TrainingRow's desktop/mobile markup from trainings-directory.tsx
 *  (the /treninji page) so this homepage section reads as the same component. */
function HomeTrainingRow({ training }: { training: TrainingListItem }) {
  return (
    <>
      <div className="sm:hidden">
        <TrainingFixtureCard training={training} />
      </div>

      <div
        className={cn(
          "relative hidden items-center gap-8 py-7 sm:flex",
          training.isPast && "opacity-50",
        )}
      >
        <div className="flex w-16 shrink-0 flex-col items-start leading-none text-slate-600">
          <span className="text-4xl font-extrabold">{training.day}</span>
          <span className="mt-1 text-sm font-semibold text-slate-400 uppercase">{training.month}</span>
        </div>

        {training.coaches.length > 0 && (
          <div className="flex min-w-0 items-center gap-2">
            <CoachAvatars coaches={training.coaches} avatarClassName="h-8 w-8 text-xs" />
            <span className="hidden max-w-[220px] min-w-0 text-base leading-tight text-slate-400 sm:line-clamp-2">
              {training.coaches.map((coach) => coach.name).join(", ")}
            </span>
          </div>
        )}

        <span className="absolute left-1/2 -translate-x-1/2 text-center text-3xl font-extrabold text-club-navy">
          {training.startTime} – {training.endTime}
        </span>

        <div className="ml-auto flex min-w-0 w-64 shrink-0 flex-col items-end gap-1.5">
          <div className="flex min-w-0 items-center gap-2 text-right text-base text-slate-400">
            <MapPin className="h-5 w-5 shrink-0" />
            <span className="min-w-0 line-clamp-2 leading-tight">{training.location}</span>
          </div>

          <span className="w-fit max-w-full truncate rounded-full bg-slate-100 px-4 py-2 text-sm text-club-navy">
            {training.teamName}
          </span>
        </div>
      </div>
    </>
  );
}

export async function HomeUpcomingTrainings() {
  const trainings = await getAllTrainingsFromDb();

  const upcoming = trainings
    .filter((training) => !training.isPast)
    .sort((a, b) => `${a.rawDate}${a.startTime}`.localeCompare(`${b.rawDate}${b.startTime}`));

  const displayed = upcoming.slice(0, 4);

  if (trainings.length === 0) return null;

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-5 flex items-center justify-center gap-4 sm:mb-6 sm:justify-between">
          <div className="relative flex min-h-24 min-w-0 flex-1 flex-col items-center justify-center sm:min-h-32 sm:items-start">
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:text-8xl"
            >
              Treniņi
            </span>
            <h2 className="relative text-center text-3xl tracking-[-0.02em] text-club-navy sm:text-left sm:text-4xl">
              Treniņi
            </h2>
          </div>
          <Link
            href="/treninji"
            className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 py-1.5 pr-1.5 pl-4 text-sm font-semibold text-club-navy transition-colors hover:border-slate-300 sm:flex"
          >
            Visi treniņi
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 sm:h-8 sm:w-8">
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[980px_1fr] lg:items-stretch">
          {displayed.length > 0 ? (
            <div className="divide-y divide-slate-100 sm:rounded-2xl sm:bg-white sm:px-6">
              {displayed.map((training) => (
                <HomeTrainingRow key={training.id} training={training} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              Treniņi nav atrasti.
            </div>
          )}

          <TrainingsMonthCalendar trainings={trainings} className="lg:h-full lg:rounded-b-2xl" />
        </div>
      </div>
    </section>
  );
}
