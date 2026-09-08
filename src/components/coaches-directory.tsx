"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, UserRound } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type LicenseAuthority = "UEFA" | "LFF";

const AUTHORITY_LOGO: Record<LicenseAuthority, string> = {
  UEFA: "/uefa-logo.webp",
  LFF: "/partners/lff.png",
};

type Coach = {
  name: string;
  position: string;
  license: string;
  authority: LicenseAuthority;
  teams: string[];
  photo?: string;
};

function CoachCard({ coach }: { coach: Coach }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[6/5] bg-club-gray-light">
        {coach.photo ? (
          <Image
            src={coach.photo}
            alt={coach.name}
            fill
            className="object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            aria-label={`${coach.name} — nav pieejama fotogrāfija`}
          >
            <UserRound className="h-16 w-16 text-club-muted" strokeWidth={1.25} />
          </div>
        )}

        <span className="absolute top-4 right-4 text-sm font-bold tracking-wide text-white/90 uppercase">
          {coach.teams.join(" / ")}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-2xl text-club-navy">
            {coach.name}
          </h3>
          <Link
            href="#footer"
            aria-label={`Sazināties ar ${coach.name}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-club-navy transition hover:bg-club-red hover:text-white"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-0.5 text-slate-400">{coach.position}</p>
        <p className="mt-4 flex items-center gap-2 text-sm text-club-navy">
          <Image
            src={AUTHORITY_LOGO[coach.authority]}
            alt={coach.authority}
            width={20}
            height={20}
            className="h-5 w-5 shrink-0 rounded-full object-contain"
          />
          {coach.license}
        </p>
      </div>
    </div>
  );
}

export function CoachesDirectory({ coaches }: { coaches: Coach[] }) {
  const [activeCategory, setActiveCategory] = useState("Visi");

  const categories = [
    "Visi",
    ...new Set(coaches.flatMap((coach) => coach.teams)),
  ];

  const visible =
    activeCategory === "Visi"
      ? coaches
      : coaches.filter((coach) => coach.teams.includes(activeCategory));

  return (
    <>
      <div className="relative h-[240px] overflow-hidden sm:h-[280px]">
        <Image
          src="/tactics-board-dusk.png"
          alt="FK Olaine treneri"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1440px] flex-col justify-center px-6">
          <nav className="mb-4 flex items-center gap-1.5 text-xs font-medium text-white/60">
            <Link href="/" className="hover:text-white">
              Sākums
            </Link>
            <span>&gt;</span>
            <Link href="/klubs" className="hover:text-white">
              Klubs
            </Link>
            <span>&gt;</span>
            <span className="text-white">Treneri</span>
          </nav>

          <h1 className="text-5xl text-white sm:text-6xl">
            Treneri
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
            Profesionāla un aizrautīga treneru komanda, kas ikdienā strādā,
            lai palīdzētu mūsu spēlētājiem attīstīties un sasniegt savus
            mērķus.
          </p>
        </div>
      </div>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    activeCategory === category
                      ? "bg-club-navy text-white"
                      : "bg-slate-100 text-club-navy hover:bg-slate-200",
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs font-semibold tracking-[0.15em] text-slate-400 uppercase">
              <span className="h-px w-8 bg-slate-300" />
              Treneru komanda
              <span className="text-club-navy">{coaches.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((coach) => (
              <CoachCard key={coach.name} coach={coach} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
