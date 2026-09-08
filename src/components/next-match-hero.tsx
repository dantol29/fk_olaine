import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, MapPin } from "lucide-react";

import { isOlaine, type UpcomingGame } from "@/lib/games";

type NextMatchHeroProps = {
  game: UpcomingGame;
};

export function NextMatchHero({ game }: NextMatchHeroProps) {
  const opponent = isOlaine(game.home.name) ? game.away : game.home;

  return (
    <div className="relative h-[360px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:h-[400px]">
      <Image
        src="/stadions.jpg"
        alt="Olaines stadions"
        fill
        priority
        className="object-cover object-[center_20%]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/5" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 px-6 pb-6 sm:px-8 sm:pb-8">
        <span className="text-xs font-bold tracking-[0.1em] text-club-red uppercase">
          Nākamā spēle
        </span>
        <h1 className="text-3xl leading-[1.05] font-extrabold text-white uppercase sm:text-4xl">
          <span className="block">FK Olaine</span>
          <span className="block">
            vs <span className="">{opponent.name}</span>
          </span>
        </h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm  text-white uppercase">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0 text-club-red" />
            {game.day} {game.month} {game.year}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 shrink-0 text-club-red" />
            {game.time}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-club-red" />
            {game.venue}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/speles"
            className="flex items-center  uppercase gap-2 rounded-lg bg-club-red px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-club-red-dark"
          >
            Spēles centrs
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/speles"
            className="rounded-lg uppercase border border-white/50 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Skatīt visas spēles
          </Link>
        </div>
      </div>
    </div>
  );
}
