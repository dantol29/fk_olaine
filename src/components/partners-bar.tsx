import Image from "next/image";

import { cn } from "@/lib/utils";
import { getPartners, type Partner } from "@/lib/partners-server";

const MARQUEE_COPIES = 12;

function PartnerLogo({ partner }: { partner: Partner }) {
  return (
    <Image
      src={partner.logoUrl}
      alt={partner.name}
      width={partner.logoWidth}
      height={partner.logoHeight}
      className={cn(
        "w-auto object-contain",
        partner.size === "lg" ? "h-16 sm:h-16" : "h-12 sm:h-11",
      )}
    />
  );
}

export async function PartnersBar() {
  const partners = await getPartners();
  if (partners.length === 0) return null;

  return (
    <div>
      {/* Mobile: big section title, like Jaunumi's, above a full-bleed
       *  looping marquee — the boxed desktop card doesn't fit this content. */}
      <div className="sm:hidden">
        <div className="relative py-2">
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 -rotate-1 whitespace-nowrap text-[4.75rem] leading-none font-extrabold tracking-tight text-club-navy/[0.06] uppercase select-none"
          >
            Partneri
          </span>
          <h2 className="relative text-center text-3xl text-club-navy">Partneri</h2>
        </div>
        <div className="partners-marquee-mask ml-[calc(50%-50vw)] mt-8 w-screen overflow-hidden">
          <div className="partners-marquee-track flex w-max items-center">
            {Array.from({ length: MARQUEE_COPIES }, (_, copy) => (
              <div
                key={copy}
                aria-hidden={copy > 0}
                className="flex shrink-0 items-center gap-x-10 pr-10"
              >
                {partners.map((partner) => (
                  <PartnerLogo key={`${partner.id}-${copy}`} partner={partner} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden overflow-hidden sm:flex sm:items-center sm:gap-10">
        <div className="relative flex h-24 w-[380px] shrink-0 items-center md:w-[440px]">
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 whitespace-nowrap text-7xl leading-none font-extrabold tracking-tight text-club-navy/[0.06] uppercase select-none md:text-8xl"
          >
            Partneri
          </span>
          <span className="text-4xl tracking-[-0.02em] text-club-navy">
            Partneri
          </span>
        </div>

        <span className="relative h-12 w-px shrink-0 bg-slate-200" />

        <div className="partners-marquee-mask relative min-w-0 flex-1 overflow-hidden">
          <div className="partners-marquee-track flex w-max items-center">
            {Array.from({ length: MARQUEE_COPIES }, (_, copy) => (
              <div
                key={copy}
                aria-hidden={copy > 0}
                className="flex shrink-0 items-center gap-x-12 pr-12"
              >
                {partners.map((partner) => (
                  <PartnerLogo key={`${partner.id}-${copy}`} partner={partner} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
