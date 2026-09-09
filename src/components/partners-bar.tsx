import Image from "next/image";

import { cn } from "@/lib/utils";
import { FacebookIcon, InstagramIcon } from "@/components/social-icons";

type Partner = {
  src: string;
  alt: string;
  width: number;
  height: number;
  size: string;
  needsWhite?: boolean;
};

function PartnerLogo({ partner }: { partner: Partner }) {
  return (
    <Image
      src={partner.src}
      alt={partner.alt}
      width={partner.width}
      height={partner.height}
      className={cn(
        "w-auto object-contain",
        partner.size === "lg" ? "h-14 sm:h-16" : "h-9 sm:h-10",
        partner.needsWhite && "brightness-0 invert",
      )}
    />
  );
}

export const PARTNERS = [
  {
    src: "/partners/lff.png",
    alt: "Latvijas Futbola Federācija",
    width: 629,
    height: 629,
    size: "lg",
  },
  {
    src: "/partners/olaines_novads.png",
    alt: "Olaines novads",
    width: 756,
    height: 510,
    size: "lg",
  },
  {
    src: "/partners/sporta_centrs.png",
    alt: "Olaines Sporta Centrs",
    width: 447,
    height: 447,
    size: "lg",
    needsWhite: true,
  },
  {
    src: "/partners/joma_logo.png",
    alt: "Joma",
    width: 1024,
    height: 262,
    size: "sm",
  },
  {
    src: "/partners/daily.png",
    alt: "Daily",
    width: 2169,
    height: 725,
    size: "lg",
  },
  // {
  //   src: "/partners/lff-zemgale.webp",
  //   alt: "LFF Zemgales Futbola Centrs",
  //   width: 223,
  //   height: 280,
  //   size: "lg",
  // },
];

export function PartnersBar() {
  return (
    <footer className="pt-3 pb-6">
        <div className="relative flex w-full items-center overflow-hidden rounded-[1.5rem] bg-club-navy px-6 py-4 sm:px-10 sm:py-5">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[160px] sm:w-[420px]"
          style={{ clipPath: "polygon(26% 0, 100% 0, 100% 100%, 10% 100%)" }}
        >
          <Image
            src="/stadium-corner-flag.png"
            alt=""
            fill
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-club-navy/75" />
        </div>

        <div className="relative z-10 flex w-full flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex shrink-0 items-center gap-5">
            <span className="text-2xl text-white uppercase sm:text-sm">
              Mūsu partneri
            </span>
            <span className="hidden h-9 w-px shrink-0 bg-white/40 sm:block" />
          </div>

          <div className="flex w-full min-w-0 flex-wrap items-center gap-x-8 gap-y-3 sm:w-auto sm:flex-1 sm:gap-x-12">
            {PARTNERS.slice(0, -2).map((partner) => (
              <PartnerLogo key={partner.alt} partner={partner} />
            ))}
            {/* Joma + Daily stay on the same row as each other, even when
             *  wrapping — never split across two lines. */}
            <div className="flex shrink-0 items-center gap-x-8 sm:gap-x-12">
              {PARTNERS.slice(-2).map((partner) => (
                <PartnerLogo key={partner.alt} partner={partner} />
              ))}
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-4 sm:flex sm:pl-24">
            <span className="hidden text-right text-xs leading-tight  text-white uppercase sm:block sm:text-sm">
              Kopā augam
              <br />
              stiprāki
            </span>
            <div className="flex items-center gap-2">
              <a
                href="#"
                aria-label="Instagram"
                className="flex items-center justify-center text-white/90 transition-colors hover:text-white"
              >
                <InstagramIcon className="h-8 w-8" />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="flex items-center justify-center text-white/90 transition-colors hover:text-white"
              >
                <FacebookIcon className="h-8 w-8" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
