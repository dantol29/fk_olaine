"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { JoinClubDrawer } from "@/components/join-club-drawer";

type QuickLink = {
  number: string;
  title: string;
  description: string;
  href: string;
  image: string;
};

const LINKS: QuickLink[] = [
  {
    number: "01",
    title: "Komandas",
    description: "Mūsu komandas un spēlētāji",
    href: "/komandas",
    image: "/womens-team-huddle.png",
  },
  {
    number: "02",
    title: "Treneri",
    description: "Iepazīsti treneru komandu",
    href: "/treneri",
    image: "/coach-portrait.png",
  },
  {
    number: "03",
    title: "Treniņi",
    description: "Grafiki un norises vietas",
    href: "/?type=training#kalendars",
    image: "/player-shooting.png",
  },
];

const JOIN_LINK: QuickLink = {
  number: "04",
  title: "Pievienojies",
  description: "Kļūsti par daļu no FK Olaine",
  href: "/kontakti",
  image: "/bench-gear-2.png",
};

function CardVisual({
  number,
  title,
  description,
}: Omit<QuickLink, "href" | "image">) {
  return (
    <>
      <div className="relative z-10 flex items-start justify-between gap-2">
        <span className="ml-auto text-4xl font-extrabold text-white/25 sm:ml-0 sm:text-5xl">
          {number}
        </span>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl text-white sm:text-2xl">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-white/70 sm:text-[13px]">
            {description}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40 text-white transition group-hover:border-club-red group-hover:bg-club-red">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </>
  );
}

const BENTO_CARD_CLASSES = [
  "lg:col-span-3",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-3",
] as const;

export function QuickLinksSection({ bento = false }: { bento?: boolean }) {
  if (bento) {
    return (
      <>
        {LINKS.map((link, index) => (
          <Link
            key={link.title}
            href={link.href}
            className={`group relative flex min-h-[230px] flex-col justify-between overflow-hidden rounded-[1.5rem] p-5 text-left sm:min-h-[260px] sm:p-6 lg:min-h-0 ${BENTO_CARD_CLASSES[index]}`}
          >
            <Image
              src={link.image}
              alt=""
              fill
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/90" />
            <CardVisual {...link} />
          </Link>
        ))}

        <JoinClubDrawer triggerClassName={`group relative flex min-h-[230px] flex-col justify-between overflow-hidden rounded-[1.5rem] p-5 text-left sm:min-h-[260px] sm:p-6 lg:min-h-0 ${BENTO_CARD_CLASSES[3]}`}>
          <Image
            src={JOIN_LINK.image}
            alt=""
            fill
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/90" />
          <CardVisual {...JOIN_LINK} />
        </JoinClubDrawer>
      </>
    );
  }

  return (
    <section className="flex h-full flex-col gap-3">
      <div className="hidden items-center gap-3 pt-4 lg:flex">
        <h2 className="text-3xl text-club-navy sm:text-4xl">Informācija</h2>
      </div>
      <div className="ml-[calc(50%-50vw)] grid w-screen flex-1 grid-cols-1 gap-0 sm:ml-0 sm:w-full sm:grid-cols-2 sm:gap-4 lg:gap-5">
        {LINKS.map((link) => (
          <Link
            key={link.title}
            href={link.href}
            className="group relative flex aspect-[16/9] flex-col justify-between overflow-hidden p-5 sm:aspect-[3/4] sm:rounded-[1.5rem] sm:p-6"
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

        <JoinClubDrawer triggerClassName="group relative flex aspect-[16/9] flex-col justify-between overflow-hidden rounded-b-[1.5rem] p-5 text-left sm:aspect-[3/4] sm:rounded-[1.5rem] sm:p-6">
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
