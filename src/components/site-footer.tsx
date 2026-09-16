import Image from "next/image";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";

import { FacebookIcon, InstagramIcon } from "@/components/social-icons";
import { cn } from "@/lib/utils";
import { getPartners } from "@/lib/partners-server";
import { getSiteSettings } from "@/lib/site-settings";

function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xl tracking-[-0.02em] text-white sm:text-2xl">
      {children}
    </h3>
  );
}

export async function SiteFooter() {
  const [settings, partners] = await Promise.all([getSiteSettings(), getPartners()]);
  const legalAddressFull = `${settings.legalAddress}, Latvija`;

  return (
    <footer id="footer" className="relative scroll-mt-24 overflow-hidden bg-club-navy text-white">
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 text-[5rem] leading-none font-extrabold tracking-[-0.05em] whitespace-nowrap text-white/[0.025] uppercase select-none sm:text-[9rem] lg:text-[13rem]"
      >
        FK Olaine
      </span>

      <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 gap-y-10 px-6 py-14 sm:grid-cols-2 sm:gap-x-12 lg:grid-cols-4 lg:gap-x-10 lg:py-16">
        <section>
          <Image
            src="/fk-olaine-crest-v2.png"
            alt="FK Olaine"
            width={72}
            height={75}
            className="h-16 w-auto"
          />
          <p className="mt-5 text-2xl tracking-[-0.02em]">FK Olaine</p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-white/55">
            Olaines futbola klubs kopš 2008. gada.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <a
              href="https://www.instagram.com/fkolaine_sievietes/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-white/60 transition hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
            >
              <InstagramIcon className="h-8 w-8" />
            </a>
            <a
              href="https://www.facebook.com/afaolaine.sievietes/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-white/60 transition hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
            >
              <FacebookIcon className="h-7 w-7" />
            </a>
          </div>
        </section>

        <section className="border-t border-white/10 pt-7 sm:border-t-0 sm:pt-0 lg:border-l lg:pl-10">
          <FooterHeading>Kontakti</FooterHeading>
          <ul className="mt-6 space-y-5 text-sm">
            <li>
              <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="group flex items-center gap-3 text-white/65 transition hover:text-white">
                <Phone className="h-5 w-5 shrink-0 text-white" />
                {settings.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${settings.email}`} className="group flex items-center gap-3 text-white/65 transition hover:text-white">
                <Mail className="h-5 w-5 shrink-0 text-white" />
                {settings.email}
              </a>
            </li>
            <li>
              <a href={mapsUrl(settings.stadiumAddress)} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 text-white/65 transition hover:text-white">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-white" />
                <span>{settings.stadiumAddress}</span>
                <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 opacity-50" />
              </a>
            </li>
          </ul>
        </section>

        <section className="border-t border-white/10 pt-7 sm:border-t-0 sm:pt-0 lg:border-l lg:pl-10">
          <FooterHeading>Kluba rekvizīti</FooterHeading>
          <div className="mt-6 space-y-5 text-sm leading-6">
            <div>
              <p className="text-white">{settings.legalName}</p>
              <p className="text-white/50">Reģ. Nr. {settings.regNr}</p>
            </div>
            <div className="text-white/50">
              <p className="text-white">{settings.bankName}</p>
              <p className="break-all">{settings.bankAccount}</p>
              <p>Kods: {settings.bankCode}</p>
            </div>
            <a href={mapsUrl(legalAddressFull)} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 text-white/50 transition hover:text-white">
              {legalAddressFull}
              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0" />
            </a>
          </div>
        </section>

        <section className="border-t border-white/10 pt-7 sm:border-t-0 sm:pt-0 lg:border-l lg:pl-10">
          <FooterHeading>Mūsu partneri</FooterHeading>
          <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-6">
            {partners.map((partner) => {
              const image = (
                <Image
                  src={partner.logoUrl}
                  alt={partner.name}
                  width={partner.logoWidth}
                  height={partner.logoHeight}
                  className={cn(
                    "w-auto object-contain transition-opacity hover:opacity-70",
                    partner.size === "lg" ? "h-12" : "h-9",
                    partner.needsWhite && "brightness-0 invert",
                  )}
                />
              );

              return partner.websiteUrl ? (
                <a key={partner.id} href={partner.websiteUrl} target="_blank" rel="noopener noreferrer">
                  {image}
                </a>
              ) : (
                <span key={partner.id}>{image}</span>
              );
            })}
          </div>
        </section>
      </div>

      <div className="border-t border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 text-sm text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FK Olaine. Visas tiesības aizsargātas.</p>
          <a href="https://42days.eu/lv" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 transition hover:text-white">
            Izstrādājis
            <Image src="/42logo-white.webp" alt="42days.eu" width={180} height={120} className="h-8 w-auto" />
          </a>
        </div>
      </div>
    </footer>
  );
}
