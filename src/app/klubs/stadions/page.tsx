import type { Metadata } from "next";
import Image from "next/image";
import { LandPlot, Lightbulb, MapPin, ParkingSquare, Shirt, Users } from "lucide-react";

import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Stadions",
  description:
    "FK Olaine mājas stadions Zeiferta ielā 4, Olainē — mākslīgais zālājs, apgaismojums un infrastruktūra.",
  alternates: { canonical: "/klubs/stadions" },
};

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
        <section className="pt-4 sm:px-6">
          <div className="relative mx-auto h-[320px] max-w-[1440px] overflow-hidden rounded-b-[2rem] sm:h-[380px] sm:rounded-[2rem]">
            <Image
              src="/stadions.jpg"
              alt="Olaines pilsētas stadions"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

            <div className="relative z-10 flex h-full w-full flex-col justify-end px-6 pb-8 sm:px-10 sm:pb-10">
              <span className="flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 uppercase backdrop-blur-sm">
                <MapPin className="h-3.5 w-3.5" />
                {ADDRESS}
              </span>
              <h1 className="mt-3 text-5xl text-white sm:text-6xl">Stadions</h1>
              <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
                Olaines pilsētas stadions — mūsu komandu mājas laukums, mākslīgais
                zālājs un pilna infrastruktūra spēlēm un treniņiem.
              </p>
            </div>
          </div>
        </section>

        {/* Address + facts + map */}
        <section className="px-6 pt-8 pb-8">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="flex flex-col rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8">
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

              <div className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
                {FACTS.map((fact) => (
                  <div key={fact.label} className="flex items-center gap-4 py-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-club-red/10 text-club-red">
                      <fact.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-club-navy">{fact.label}</p>
                      <p className="text-sm text-slate-500">{fact.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 shadow-sm">
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
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
