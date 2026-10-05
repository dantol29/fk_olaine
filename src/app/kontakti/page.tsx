import type { Metadata } from "next";

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

  return <>
    <SiteHeader />
    <main className="bg-white text-black">
      <section className="contacts-page-hero bg-black px-6 pt-6 pb-8 text-white sm:px-10 sm:pt-8 sm:pb-10 lg:px-14">
        <div className="mx-auto max-w-[1920px]"><h1 className="text-5xl leading-tight font-semibold uppercase sm:text-6xl lg:text-7xl">Kontakti</h1></div>
      </section>
      <section className="px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="mb-8 text-3xl font-semibold uppercase sm:text-4xl">Sazinies ar mums</h2>
          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            <dl className="space-y-6">
              <div><dt className="text-sm text-black/50">Tālrunis</dt><dd className="mt-2 text-lg"><a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="hover:underline focus-visible:outline-black">{settings.phone}</a></dd></div>
              <div><dt className="text-sm text-black/50">E-pasts</dt><dd className="mt-2 text-lg break-all"><a href={`mailto:${settings.email}`} className="hover:underline focus-visible:outline-black">{settings.email}</a></dd></div>
            </dl>
            <dl className="space-y-6">
              <div><dt className="text-sm text-black/50">Stadions</dt><dd className="mt-2 text-lg"><a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline focus-visible:outline-black">{settings.stadiumAddress}</a></dd></div>
            </dl>
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
