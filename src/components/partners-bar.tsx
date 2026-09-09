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
        partner.size === "lg"
          ? "h-14 sm:h-16 sm:max-[1342px]:min-[1079px]:h-11 sm:max-[1079px]:h-9"
          : "h-9 sm:h-10 sm:max-[1342px]:min-[1079px]:h-8 sm:max-[1079px]:h-7",
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
    <footer className="ml-[calc(50%-50vw)] w-screen pt-3 pb-6 sm:mx-0 sm:w-auto">
        <div className="relative flex w-full items-center overflow-hidden rounded-none bg-club-navy px-6 py-4 sm:rounded-[1.5rem] sm:px-10 sm:py-5">
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

        <div className="relative z-10 flex w-full flex-col items-start gap-7 sm:flex-row sm:items-center sm:gap-8">
          <div className="hidden w-full shrink-0 items-center justify-center gap-5 sm:flex sm:w-auto sm:justify-start">
            <span className="text-2xl text-white uppercase sm:text-sm">
              Mūsu partneri
            </span>
            <span className="hidden h-9 w-px shrink-0 bg-white/40 sm:block" />
          </div>

          {/* Below sm this bleeds edge-to-edge (negative margin cancels the
           *  bar's own px-6); from sm up to 1000px it instead sits as a
           *  normal flex-1 item in the row, same slot the grid below uses
           *  above 1000px — title and the right-hand block don't move. */}
          <div className="partners-marquee-mask -mx-6 w-full overflow-hidden min-[1001px]:hidden sm:mx-0 sm:w-auto sm:min-w-0 sm:flex-1">
            <div className="partners-marquee-track flex w-max items-center">
              {[0, 1].map((copy) => (
                <div key={copy} className="flex items-center gap-x-10 pr-10">
                  {PARTNERS.map((partner) => (
                    <PartnerLogo key={`${partner.alt}-${copy}`} partner={partner} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden min-w-0 flex-wrap items-center gap-x-8 gap-y-3 min-[1001px]:flex sm:w-auto sm:flex-1 sm:gap-x-12 sm:max-[1342px]:min-[1079px]:gap-x-5 sm:max-[1079px]:gap-x-3">
            {PARTNERS.slice(0, -2).map((partner) => (
              <PartnerLogo key={partner.alt} partner={partner} />
            ))}
            {/* Joma + Daily stay on the same row as each other, even when
             *  wrapping — never split across two lines. */}
            <div className="flex shrink-0 items-center gap-x-8 sm:gap-x-12 sm:max-[1342px]:min-[1079px]:gap-x-5 sm:max-[1079px]:gap-x-3">
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
                href="https://www.instagram.com/fkolaine_sievietes/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex items-center justify-center text-white/90 transition-colors hover:text-white"
              >
                <InstagramIcon className="h-8 w-8" />
              </a>
              <a
                href="https://www.facebook.com/afaolaine.sievietes/"
                target="_blank"
                rel="noopener noreferrer"
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
