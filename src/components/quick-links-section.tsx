"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { JoinClubDrawer } from "@/components/join-club-drawer";

type QuickLink = {
  number: string;
  eyebrow: string[];
  title: string;
  description: string;
  href: string;
  image: string;
};

const LINKS: QuickLink[] = [
  {
    number: "01",
    eyebrow: ["FK Olaine"],
    title: "Komandas",
    description: "Uzzini vairāk par mūsu komandām un spēlētājiem.",
    href: "/komandas",
    image: "/womens-team-huddle.png",
  },
  {
    number: "02",
    eyebrow: ["Attīstība", "caur futbolu"],
    title: "Treneri",
    description: "Iepazīsties ar mūsu treneru komandu.",
    href: "/treneri",
    image: "/coach-portrait.png",
  },
  {
    number: "03",
    eyebrow: ["Disciplīna", "Progress", "Komanda"],
    title: "Treniņi",
    description: "Treniņu grafiks, norises vietas un vairāk informācijas.",
    href: "/?type=training#kalendars",
    image: "/player-shooting.png",
  },
];

const JOIN_LINK: QuickLink = {
  number: "04",
  eyebrow: ["Viena", "kopiena"],
  title: "Pievienojies",
  description: "Kļūsti par daļu no FK Olaine — vienas lielas futbola ģimenes.",
  href: "/kontakti",
  image: "/bench-gear-2.png",
};

function CardVisual({
  number,
  eyebrow,
  title,
  description,
}: Omit<QuickLink, "href" | "image">) {
  return (
    <>
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="hidden flex-col leading-tight sm:flex">
          {eyebrow.map((line) => (
            <span
              key={line}
              className="text-[11px] tracking-[0.2em] text-white/80 uppercase"
            >
              {line}
            </span>
          ))}
          <span className="mt-2 h-px w-8 bg-white/40" />
        </div>
        <span className="ml-auto text-4xl font-extrabold text-white/25 sm:ml-0 sm:text-5xl">
          {number}
        </span>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl text-white sm:text-2xl">{title}</h3>
          <p className="mt-1.5 text-sm text-white/70">{description}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40 text-white transition group-hover:border-club-red group-hover:bg-club-red">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </>
  );
}

export function QuickLinksSection() {
  return (
    <section className="flex h-full flex-col gap-3">
      <div className="hidden items-center gap-3 pt-4 lg:flex">
        <h2 className="text-3xl text-club-navy sm:text-4xl">Informācija</h2>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
        {LINKS.map((link) => (
          <Link
            key={link.title}
            href={link.href}
            className="group relative flex aspect-[16/9] flex-col justify-between overflow-hidden rounded-[1.5rem] p-5 sm:aspect-[3/4] sm:p-6"
          >
            <Image
              src={link.image}
              alt=""
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/90" />
            <CardVisual {...link} />
          </Link>
        ))}

        <JoinClubDrawer triggerClassName="group relative flex aspect-[16/9] flex-col justify-between overflow-hidden rounded-[1.5rem] p-5 text-left sm:aspect-[3/4] sm:p-6">
          <Image
            src={JOIN_LINK.image}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/90" />
          <CardVisual {...JOIN_LINK} />
        </JoinClubDrawer>
      </div>
    </section>
  );
}
