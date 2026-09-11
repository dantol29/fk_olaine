import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import { getPartners } from "@/lib/partners-server";
import { getSiteSettings } from "@/lib/site-settings";
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/social-icons";

function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex items-center justify-center text-white/70 transition hover:text-white"
    >
      {children}
    </a>
  );
}

function ColumnLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs tracking-[0.2em] text-white/60 uppercase">
      {children}
    </span>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm text-white">{label}</p>
      <div className="mt-1 text-sm leading-relaxed text-white/60">
        {children}
      </div>
    </div>
  );
}

export async function SiteFooter() {
  const [settings, partners] = await Promise.all([getSiteSettings(), getPartners()]);
  const legalAddressFull = `${settings.legalAddress}, Latvija`;

  return (
    <footer
      id="footer"
      className="scroll-mt-24 text-white"
      style={{
        background:
          "radial-gradient(circle at 88% 92%, rgba(24,48,72,0.4) 0%, rgba(24,48,72,0) 55%), " +
          "radial-gradient(circle at 92% 8%, rgba(24,48,72,0.3) 0%, rgba(24,48,72,0) 50%), " +
          "radial-gradient(circle at 55% 40%, #102235 0%, #0b1927 45%, #07131f 100%)",
      }}
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-x-10 gap-y-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1fr_1.2fr]">
        {/* Brand */}
        <div>
          <Image
            src="/fk-olaine-crest-v2.png"
            alt="FK Olaine"
            width={112}
            height={116}
            className="h-24 w-auto"
          />
          <p className="mt-4 text-lg tracking-[0.03em] text-white">
            FK OLAINE
          </p>
          <p className="mt-1 text-sm text-white/60">
            FK Olaine kopš 2008. gada.
          </p>

          <div className="mt-5 flex items-center gap-4">
            <SocialLink
              href="https://www.instagram.com/fkolaine_sievietes/"
              label="Instagram"
            >
              <InstagramIcon className="h-9 w-9" />
            </SocialLink>
            <SocialLink
              href="https://www.facebook.com/afaolaine.sievietes/"
              label="Facebook"
            >
              <FacebookIcon className="h-8 w-8" />
            </SocialLink>
          </div>
        </div>

        {/* Biedrība */}
        <div className="lg:border-l lg:border-[#3d5570]/20 lg:pl-10">
          <ColumnLabel>Biedrība</ColumnLabel>
          <h3 className="mt-3 text-lg text-white">{settings.legalName}</h3>
          <div className="mt-4 flex flex-col gap-4">
            <FieldGroup label="Reģistrācijas numurs">
              <p>Reģ. Nr. {settings.regNr}</p>
            </FieldGroup>
            <FieldGroup label="Bankas rekvizīti">
              <p>{settings.bankName}</p>
              <p>Konta Nr. {settings.bankAccount},</p>
              <p>Kods: {settings.bankCode}</p>
            </FieldGroup>
          </div>
        </div>

        {/* Kontakti */}
        <div className="lg:border-l lg:border-[#3d5570]/20 lg:pl-10">
          <ColumnLabel>Kontakti</ColumnLabel>
          <ul className="mt-3 flex flex-col gap-4">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-white" />
              <div>
                <p className="text-sm text-white">Juridiskā adrese</p>
                <a
                  href={mapsUrl(legalAddressFull)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/60 hover:text-white hover:underline"
                >
                  {legalAddressFull}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-white" />
              <div>
                <p className="text-sm text-white">Stadiona adrese</p>
                <a
                  href={mapsUrl(settings.stadiumAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/60 hover:text-white hover:underline"
                >
                  {settings.stadiumAddress}
                </a>
              </div>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-5 w-5 shrink-0 text-white" />
              <a
                href={`tel:${settings.phone.replace(/\s+/g, "")}`}
                className="text-sm text-white"
              >
                {settings.phone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-5 w-5 shrink-0 text-white" />
              <a href={`mailto:${settings.email}`} className="text-sm text-white">
                {settings.email}
              </a>
            </li>
          </ul>
        </div>

        {/* Mūsu partneri */}
        <div className="lg:border-l lg:border-[#3d5570]/20 lg:pl-10">
          <ColumnLabel>Mūsu partneri</ColumnLabel>
          <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-6">
            {partners.map((partner) => (
              <Image
                key={partner.id}
                src={partner.logoUrl}
                alt={partner.name}
                width={partner.logoWidth}
                height={partner.logoHeight}
                className={cn(
                  "w-auto object-contain",
                  partner.size === "lg" ? "h-14" : "h-10",
                  partner.needsWhite && "brightness-0 invert",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[#3d5570]/20 px-6 py-8">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 text-sm text-white/40">
          <p>
            © {new Date().getFullYear()} FK Olaine. Visas tiesības aizsargātas.
          </p>
          <a
            href="https://42days.eu/lv"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 transition hover:text-white"
          >
            Izstrādājis
            <Image
              src="/42logo-white.webp"
              alt="42days.eu"
              width={180}
              height={120}
              className="h-9 w-auto"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
