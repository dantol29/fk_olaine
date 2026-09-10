import Image from "next/image";

import { cn } from "@/lib/utils";

type Partner = {
  src: string;
  alt: string;
  width: number;
  height: number;
  size: "lg" | "sm";
  /** Only relevant on a dark background (e.g. the footer's own render of
   *  this list) — this bar's white card never inverts its logos. */
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
        partner.size === "lg" ? "h-12 sm:h-16" : "h-9 sm:h-11",
      )}
    />
  );
}

export const PARTNERS: Partner[] = [
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
    src: "/partners/joma-logo-color.png",
    alt: "Joma",
    width: 1024,
    height: 262,
    size: "sm",
  },
  {
    src: "/partners/daily-logo.png",
    alt: "Daily",
    width: 368,
    height: 106,
    size: "lg",
  },
];

export function PartnersBar() {
  return (
    <div className="sm:rounded-[1.5rem] sm:bg-white sm:px-10 sm:py-8">
      {/* Mobile: big section title, like Jaunumi's, above a full-bleed
       *  looping marquee — the boxed desktop card doesn't fit this content. */}
      <div className="sm:hidden">
        <h2 className="text-3xl text-club-navy">Mūsu partneri</h2>
        <div className="partners-marquee-mask ml-[calc(50%-50vw)] mt-8 w-screen overflow-hidden">
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
      </div>

      <div className="hidden sm:flex sm:items-center sm:gap-10">
        <div className="flex shrink-0 flex-col">
          <span className="text-base font-semibold tracking-wide text-club-navy uppercase">
            Mūsu partneri
          </span>
          <span className="text-sm text-slate-400">Kopā augam stiprāki</span>
        </div>

        <span className="h-12 w-px shrink-0 bg-slate-200" />

        <div className="grid min-w-0 flex-1 grid-cols-5">
          {PARTNERS.map((partner, index) => (
            <div
              key={partner.alt}
              className={cn(
                "flex items-center justify-center px-6",
                index > 0 && "border-l border-slate-200",
              )}
            >
              <PartnerLogo partner={partner} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
