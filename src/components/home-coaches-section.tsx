import Image from "next/image";
import Link from "next/link";
import { ArrowRight, UserRound } from "lucide-react";

import { db } from "@/db/client";

const AUTHORITY_LOGO: Record<"UEFA" | "LFF", string> = {
  UEFA: "/uefa-logo.webp",
  LFF: "/partners/lff.png",
};

async function getCoaches() {
  const rows = await db.query.coaches.findMany({
    with: { coachTeams: { with: { team: true } } },
    orderBy: (coaches, { asc }) => [asc(coaches.name)],
  });

  return rows.map((coach) => ({
    id: coach.id,
    name: coach.name,
    position: coach.position,
    license: coach.license,
    authority: coach.authority,
    teams: coach.coachTeams.map((ct) => ct.team?.name).filter((name) => name !== undefined),
    photo: coach.photoUrl,
  }));
}

export async function HomeCoachesSection() {
  const coaches = await getCoaches();
  if (coaches.length === 0) return null;

  return (
    <section>
      <div className="mb-5 flex items-center justify-center gap-4 sm:mb-6 sm:justify-between">
        <div className="relative flex min-h-24 min-w-0 flex-1 flex-col items-center justify-center sm:min-h-32 sm:items-start">
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:text-8xl"
          >
            Treneri
          </span>
          <h2 className="relative text-center text-3xl tracking-[-0.02em] text-club-navy sm:text-left sm:text-4xl">
            Treneri
          </h2>
        </div>
        <Link
          href="/treneri"
          className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 py-1.5 pr-1.5 pl-4 text-sm font-semibold text-club-navy transition-colors hover:border-slate-300 sm:flex"
        >
          Visi treneri
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 sm:h-8 sm:w-8">
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {coaches.map((coach) => (
          <Link
            key={coach.id}
            href="/treneri"
            className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-[1.5rem] bg-club-navy"
          >
            {coach.photo ? (
              <Image
                src={coach.photo}
                alt={coach.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-club-gray-light">
                <UserRound className="h-16 w-16 text-club-muted" strokeWidth={1.25} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

            {coach.teams.length > 0 && (
              <span className="absolute top-4 right-4 z-10 text-xs font-bold tracking-wide text-white/90 uppercase">
                {coach.teams.join(" / ")}
              </span>
            )}

            <div className="relative z-10 p-5">
              <h3 className="text-xl text-white">{coach.name}</h3>
              <p className="mt-0.5 text-sm text-white/70">{coach.position}</p>
              <p className="mt-3 flex items-center gap-2 text-xs text-white/80">
                <Image
                  src={AUTHORITY_LOGO[coach.authority]}
                  alt={coach.authority}
                  width={16}
                  height={16}
                  className="h-4 w-4 shrink-0 rounded-full object-contain"
                />
                {coach.license}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
