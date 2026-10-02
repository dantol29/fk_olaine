import type { Metadata } from "next";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Kontakti",
  description: "FK Olaine kontakti, stadiona adrese un kluba rekvizīti.",
  alternates: { canonical: "/kontakti" },
};

export default async function KontaktiPage() {
  const settings = await getSiteSettings();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.stadiumAddress}, Latvija`)}`;
  const contactClass = "group flex min-w-0 flex-col border border-black/10 bg-white p-6 sm:p-8";

  return <>
    <SiteHeader />
    <main className="bg-white text-black">
      <section className="contacts-page-hero bg-black px-6 pt-6 pb-8 text-white sm:px-10 sm:pt-8 sm:pb-10 lg:px-14">
        <div className="mx-auto max-w-[1920px]"><h1 className="text-5xl leading-tight font-semibold uppercase sm:text-6xl lg:text-7xl">Kontakti</h1></div>
      </section>
      <section className="px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="mb-8 text-3xl font-semibold uppercase sm:text-4xl">Sazinies ar mums</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className={contactClass}>
              <Phone className="mb-6 size-6" aria-hidden="true" /><span className="text-sm text-black/50">Tālrunis</span><span className="mt-2 text-xl font-semibold group-hover:underline sm:text-2xl">{settings.phone}</span>
            </a>
            <a href={`mailto:${settings.email}`} className={contactClass}>
              <Mail className="mb-6 size-6" aria-hidden="true" /><span className="text-sm text-black/50">E-pasts</span><span className="mt-2 text-xl font-semibold break-all group-hover:underline sm:text-2xl">{settings.email}</span>
            </a>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={contactClass}>
              <MapPin className="mb-6 size-6" aria-hidden="true" /><span className="text-sm text-black/50">Stadions</span><span className="mt-2 text-xl font-semibold group-hover:underline sm:text-2xl">{settings.stadiumAddress}</span><span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase">Skatīt kartē <ArrowUpRight className="size-4" aria-hidden="true" /></span>
            </a>
          </div>
          <section className="mt-16 border-t border-black/10 pt-10 sm:mt-24 sm:pt-12" aria-labelledby="club-details-heading">
            <h2 id="club-details-heading" className="mb-8 text-3xl font-semibold uppercase sm:text-4xl">Kluba rekvizīti</h2>
            <div className="grid gap-10 md:grid-cols-2 md:gap-16">
              <dl className="space-y-6">
                <div><dt className="text-sm text-black/50">Nosaukums</dt><dd className="mt-2 text-lg font-medium">{settings.legalName}</dd></div>
                <div><dt className="text-sm text-black/50">Reģistrācijas numurs</dt><dd className="mt-2 text-lg">{settings.regNr}</dd></div>
                <div><dt className="text-sm text-black/50">Juridiskā adrese</dt><dd className="mt-2 text-lg">{settings.legalAddress}</dd></div>
              </dl>
              <dl className="space-y-6">
                <div><dt className="text-sm text-black/50">Banka</dt><dd className="mt-2 text-lg">{settings.bankName}</dd></div>
                <div><dt className="text-sm text-black/50">Bankas konts</dt><dd className="mt-2 text-lg break-all">{settings.bankAccount}</dd></div>
                <div><dt className="text-sm text-black/50">Bankas kods</dt><dd className="mt-2 text-lg">{settings.bankCode}</dd></div>
              </dl>
            </div>
          </section>
        </div>
      </section>
    </main>
    <SiteFooter />
  </>;
}
