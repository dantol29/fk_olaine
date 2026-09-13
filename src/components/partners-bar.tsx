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
    <div className="partners-marquee-mask w-full overflow-hidden">
      <div className="partners-marquee-track flex w-max items-center">
        {Array.from({ length: MARQUEE_COPIES }, (_, copy) => (
          <div
            key={copy}
            aria-hidden={copy > 0}
            className="flex shrink-0 items-center gap-x-10 pr-10 sm:gap-x-12 sm:pr-12"
          >
            {partners.map((partner) => (
              <PartnerLogo key={`${partner.id}-${copy}`} partner={partner} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
