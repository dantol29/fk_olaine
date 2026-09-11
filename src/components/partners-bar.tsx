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
        partner.size === "lg" ? "h-12 sm:h-16" : "h-9 sm:h-11",
      )}
    />
  );
}

export async function PartnersBar() {
  const partners = await getPartners();
  if (partners.length === 0) return null;

  return (
    <div className="sm:rounded-[1.5rem] sm:bg-white sm:px-10 sm:py-8">
      {/* Mobile: big section title, like Jaunumi's, above a full-bleed
       *  looping marquee — the boxed desktop card doesn't fit this content. */}
      <div className="sm:hidden">
        <h2 className="text-center text-3xl text-club-navy">Mūsu partneri</h2>
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

      <div className="hidden sm:flex sm:items-center sm:gap-10">
        <div className="flex shrink-0 flex-col">
          <span className="text-base font-semibold tracking-wide text-club-navy uppercase">
            Mūsu partneri
          </span>
          <span className="text-sm text-slate-400">Kopā augam stiprāki</span>
        </div>

        <span className="h-12 w-px shrink-0 bg-slate-200" />

        <div className="partners-marquee-mask min-w-0 flex-1 overflow-hidden">
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
