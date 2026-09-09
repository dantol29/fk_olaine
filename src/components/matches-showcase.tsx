"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, MapPin } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { gameDate, type Team, type UpcomingGame } from "@/lib/games";
import {
  CoverflowCarousel,
  type CoverflowCarouselHandle,
  type CoverflowSlide,
} from "@/components/ui/coverflow-carousel";
import AnimatedNumberCountdown from "@/components/ui/countdown-number";

type MatchesShowcaseProps = {
  games: UpcomingGame[];
};

function TeamBadge({ team, isActive }: { team: Team; isActive: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      {team.logo ? (
        <Image
          src={team.logo}
          alt={team.name}
          width={64}
          height={64}
          className="h-14 w-14 object-contain drop-shadow-sm sm:h-16 sm:w-16"
        />
      ) : (
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full text-xs font-extrabold tracking-wide text-white shadow-sm ring-4 ring-white sm:h-16 sm:w-16",
            team.color ?? "bg-club-navy",
          )}
          aria-label={`${team.name} logo`}
        >
          {team.initials ?? team.name.slice(0, 3).toUpperCase()}
        </div>
      )}
      <span
        className={cn(
          "line-clamp-2 text-xs leading-tight sm:text-sm",
          isActive ? "text-club-navy" : "text-white",
        )}
      >
        {team.name}
      </span>
    </div>
  );
}

export function MatchCard({
  game,
  isActive,
  elevated = true,
  className,
}: {
  game: UpcomingGame;
  isActive: boolean;
  elevated?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex h-full flex-col rounded-xl p-5 sm:p-6",
        isActive
          ? cn(
              "w-full border border-black/5 bg-club-gray-light",
              elevated && "shadow-[0_16px_32px_-16px_rgba(11,41,64,0.35)]",
            )
          : "w-[82%] cursor-pointer border border-white/15 bg-club-navy/85 backdrop-blur-lg",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div
          className={cn(
            "flex shrink-0 flex-col leading-none",
            isActive ? "text-club-navy" : "text-white/80",
          )}
        >
          <span
            className={cn(
              "font-extrabold tracking-tight",
              isActive ? "text-4xl" : "text-3xl",
            )}
          >
            {game.day}
          </span>
          <span
            className={cn(
              "mt-1 text-xs uppercase",
              isActive ? "text-slate-400" : "text-white/40",
            )}
          >
            {game.month}
          </span>
        </div>
        <span
          className={cn(
            "uppercase",
            isActive
              ? "text-sm text-club-red"
              : "text-xs font-medium text-white/45",
          )}
        >
          {game.league}
        </span>
      </div>

      <div className="mb-5 flex flex-1 items-center justify-between gap-2">
        <TeamBadge team={game.home} isActive={isActive} />
        <span
          className={cn(
            "shrink-0 text-xs font-extrabold",
            isActive ? "text-slate-300" : "text-white/25",
          )}
        >
          VS
        </span>
        <TeamBadge team={game.away} isActive={isActive} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div
          className={cn(
            "flex min-w-0 items-center gap-3",
            isActive ? "text-xs text-club-navy" : "text-[11px] text-white/45",
          )}
        >
          <span className="flex shrink-0 items-center gap-1.5">
            <Clock
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                isActive ? "text-club-red" : "text-current",
              )}
            />
            {game.time}
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                isActive ? "text-club-red" : "text-current",
              )}
            />
            <span className="truncate">{game.venue}</span>
          </span>
        </div>
        {isActive && (
          <Link
            href="/speles"
            aria-label="Spēles centrs"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-club-red bg-club-red text-white transition"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function MatchesShowcase({ games }: MatchesShowcaseProps) {
  const [index, setIndex] = useState(0);
  const carouselRef = useRef<CoverflowCarouselHandle>(null);

  if (games.length === 0) return null;

  const slides: CoverflowSlide[] = games.map((game) => ({
    alt: `${game.home.name} vs ${game.away.name}`,
  }));

  return (
    <div className="relative h-[640px] min-w-0 overflow-hidden rounded-[1.5rem] border border-slate-200 shadow-sm">
      <Image
        src="/stadium-flag-dusk.jpg"
        alt="Olaines stadions"
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-x-0 top-0 z-10 h-56 bg-gradient-to-b from-black/65 via-black/30 to-transparent" />

      <div className="absolute inset-x-0 top-12 z-20 flex flex-col items-center">
        <span className="mb-3 text-[20px] text-white/70 uppercase">
          Līdz nākamajai spēlei
        </span>
        <AnimatedNumberCountdown
          endDate={gameDate(games[0])}
          className="gap-4"
          separator={<span className="inline-block h-9 w-px bg-white/40" />}
          valueClassName="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
          labelClassName="mt-1.5 text-[9px] text-white/50 uppercase"
          labels={{
            days: "Dienas",
            hours: "Stundas",
            minutes: "Minūtes",
            seconds: "Sekundes",
          }}
        />
      </div>

      <div className="absolute inset-x-0 bottom-12 sm:bottom-16">
        <div className="relative">
          <CoverflowCarousel
            ref={carouselRef}
            className="px-1 sm:px-2"
            slides={slides}
            cardWidth="300px"
            cardHeight="300px"
            rotate={-11}
            depth={0.32}
            perspective={3.2}
            falloff={0.6}
            fade={0}
            gap={0.03}
            activeScale={0.1}
            activeLift={14}
            onSelectedChange={setIndex}
            renderSlide={(_, i, isActive) => (
              <MatchCard game={games[i]} isActive={isActive} />
            )}
          />
        </div>
      </div>

      {games.length > 1 && (
        <div className="absolute bottom-8 left-8 z-20 flex items-center gap-3 sm:left-10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => carouselRef.current?.prev()}
              aria-label="Iepriekšējā spēle"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-transparent text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => carouselRef.current?.next()}
              aria-label="Nākamā spēle"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-transparent text-white transition hover:bg-white/10"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="text-xl text-white">
            {String(index + 1).padStart(2, "0")}
            <span className="ml-1.5 text-sm font-medium text-white/50">
              /{String(games.length).padStart(2, "0")}
            </span>
          </span>
          <div className="flex gap-1.5">
            {games.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => carouselRef.current?.goTo(i)}
                aria-label={`Rādīt ${i + 1}. spēli`}
                className={cn(
                  "h-[3px] w-7 rounded-full transition-colors",
                  i === index ? "bg-club-red" : "bg-white/25",
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
