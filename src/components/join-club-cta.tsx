import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function JoinClubCta() {
  return (
    <section className="px-6 pt-6 pb-10">
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col items-start gap-6 overflow-hidden rounded-[2rem] bg-club-navy px-8 py-10 sm:px-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
        <svg
          aria-hidden="true"
          viewBox="0 0 200 240"
          className="pointer-events-none absolute top-1/2 right-[-70px] h-[320px] w-[320px] -translate-y-1/2 opacity-[0.06]"
        >
          <path
            d="M100 0 L200 42 L200 132 C200 190 158 220 100 240 C42 220 0 190 0 132 L0 42 Z"
            fill="#ffffff"
          />
        </svg>

        <div className="relative z-10 max-w-xl">
          <span className="text-xs font-bold tracking-[0.08em] text-club-red uppercase">
            Pievienojies mums
          </span>
          <h2 className="mt-2 text-2xl leading-tight font-extrabold text-white sm:text-3xl">
            Kļūsti par daļu no FK Olaine komandas
          </h2>
          <p className="mt-3 text-sm text-white/70 sm:text-base">
            Neatkarīgi no vecuma un pieredzes — mēs gaidām tevi treniņos.
            Pievienojies Olaines sieviešu futbola komandai un augsim kopā.
          </p>
        </div>

        <Link
          href="/kontakti"
          className="relative z-10 flex shrink-0 items-center gap-2 rounded-full bg-club-red px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-club-red-dark"
        >
          Pieteikties komandai
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
