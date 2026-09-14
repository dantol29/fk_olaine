import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { JoinClubDrawer } from "@/components/join-club-drawer";

export function JoinTeamCta() {
  return (
    // Hidden site-wide per request — kept mounted (not removed) so it's a
    // one-line toggle to bring back everywhere at once.
    <section className="hidden">
      <JoinClubDrawer triggerClassName="group relative flex min-h-[130px] w-full items-center overflow-hidden rounded-t-[1.5rem] py-8 text-left">
        <Image
          src="/player-shooting.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[center_25%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-black/10" />

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-8 sm:px-12">
          <div className="mt-2 flex items-center gap-4">
            <h2 className="text-2xl text-white sm:text-3xl">
              Pievienojies mūsu komandai
            </h2>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/50 text-white transition group-hover:border-club-red group-hover:bg-club-red">
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </JoinClubDrawer>
    </section>
  );
}
