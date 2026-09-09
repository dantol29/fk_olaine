import Image from "next/image";
import { LandPlot, Lightbulb, MapPin, ParkingSquare, Shirt, Users } from "lucide-react";

import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const ADDRESS = "Zeiferta iela 4, Olaine";

function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const FACTS = [
  { icon: LandPlot, label: "Segums", value: "Mākslīgais zālājs" },
  { icon: Lightbulb, label: "Apgaismojums", value: "Ir, iespējamas vakara spēles" },
  { icon: Shirt, label: "Ģērbtuves", value: "Spēlētājiem un tiesnešiem" },
  { icon: Users, label: "Skatītāju vietas", value: "Sēdvietas un stāvvietas gar malu" },
  { icon: ParkingSquare, label: "Autostāvvieta", value: "Bezmaksas, pie stadiona" },
];

export default function StadionsPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        {/* Hero */}
        <section className="px-6 pt-4">
          <div className="relative mx-auto h-[240px] max-w-[1440px] overflow-hidden rounded-[2rem] sm:h-[280px]">
            <Image
              src="/stadions.jpg"
              alt="Olaines pilsētas stadions"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

            <div className="relative z-10 flex h-full w-full flex-col justify-center px-6 sm:px-10">
              <h1 className="text-5xl text-white sm:text-6xl">Stadions</h1>
              <p className="mt-4 text-sm text-white/70 sm:text-base">
                Olaines pilsētas stadions — mūsu komandu mājas laukums.
              </p>
            </div>
          </div>
        </section>

        {/* Address + map */}
        <section className="px-6 pt-8 pb-8">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="flex flex-col justify-center rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-club-red/10 text-club-red">
                <MapPin className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-2xl text-club-navy">Adrese</h2>
              <p className="mt-1 text-sm text-slate-500">{ADDRESS}</p>
              <a
                href={mapsUrl(ADDRESS)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-fit items-center rounded-full bg-club-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-club-navy/90"
              >
                Atvērt kartē
              </a>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200">
              <iframe
                title="Olaines pilsētas stadiona atrašanās vieta"
                src={`https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`}
                className="h-[280px] w-full border-0 sm:h-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>

        {/* Basic info */}
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-[1440px]">
            <h2 className="text-2xl text-club-navy sm:text-3xl">Par stadionu</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-club-navy">
                    <fact.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-club-navy">{fact.label}</p>
                    <p className="text-sm text-slate-500">{fact.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
