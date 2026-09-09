import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { JoinClubDrawer } from "@/components/join-club-drawer";

export function JoinTeamCta() {
  return (
    <section className="sm:px-6">
      <div className="mx-auto max-w-[1440px]">
        <JoinClubDrawer triggerClassName="group relative flex min-h-[130px] w-full items-center justify-between overflow-hidden rounded-t-[1.5rem] px-8 py-8 text-left sm:rounded-[1.5rem] sm:px-12">
          <Image
            src="/player-shooting.png"
            alt=""
            fill
            className="object-cover object-[center_25%] transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-black/10" />

          <div className="relative z-10">
            <div className="mt-2 flex items-center gap-4">
              <h2 className="text-2xl text-white sm:text-3xl">
                Pievienojies mūsu komandai
              </h2>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/50 text-white transition group-hover:border-club-red group-hover:bg-club-red">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="relative z-10 hidden text-right text-xs leading-tight tracking-[0.2em] text-white uppercase sm:block">
            <p>Attīstība</p>
            <p>Komanda</p>
            <p>Raksturs</p>
            <p>Nākotne</p>
          </div>
        </JoinClubDrawer>
      </div>
    </section>
  );
}
