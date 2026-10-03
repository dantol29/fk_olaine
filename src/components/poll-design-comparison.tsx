"use client";

import { useState } from "react";
import { HomePollCard, type Poll, type PollVariant } from "@/components/home-poll-card";
import { cn } from "@/lib/utils";

const VERSIONS: { id: PollVariant; title: string; description: string }[] = [
  { id: "classic", title: "Balta kartīte", description: "Kompakta aptauja ar jautājumu virs atbildēm un sarkanu akcentu." },
  { id: "dark", title: "Tumša kartīte", description: "Melns fons, liels jautājums un tumši atbilžu lauki." },
  { id: "split", title: "Divas daļas", description: "Jautājums melnajā pusē, balsošana baltajā. Mobilajā daļas sakārtojas vertikāli." },
];

export function PollDesignComparison({ poll }: { poll: Poll }) {
  const [version, setVersion] = useState<PollVariant>("classic");
  const [mobile, setMobile] = useState(false);
  return <main className="min-h-[70svh] bg-[#fafafa] px-6 py-10 text-black sm:px-10">
    <div className="mx-auto max-w-[1440px]">
      <h1 className="text-3xl font-semibold">Aptauju dizaini</h1>
      <p className="mt-3 text-sm text-black/55">Salīdzini trīs variantus. Balsošana šeit ir priekšskatījums un nesaglabā balsis.</p>
      <div className="mt-6 flex flex-wrap gap-3" aria-label="Dizaina variants">
        {VERSIONS.map((item) => <button key={item.id} type="button" aria-pressed={version === item.id} onClick={() => setVersion(item.id)} className={cn("min-h-11 border border-black px-4 text-sm", version === item.id ? "bg-black text-white" : "bg-white hover:bg-black/5")}>{item.title}</button>)}
        <button type="button" aria-pressed={mobile} onClick={() => setMobile(!mobile)} className="min-h-11 border border-black/20 px-4 text-sm">{mobile ? "Datora skats" : "Mobilais skats"}</button>
      </div>
      <p className="mt-5 text-sm text-black/55">{VERSIONS.find((item) => item.id === version)?.description}</p>
      <div className={cn("mx-auto mt-8", mobile && "max-w-[390px]")}>
        <HomePollCard key={version} poll={poll} variant={version} previewOnly className={mobile ? cn("!max-w-full [&>header>h2]:!text-2xl", version === "split" ? "!grid-cols-1 !p-0 [&>header]:!p-6 [&>div]:!p-6" : "!p-6") : undefined} />
      </div>
    </div>
  </main>;
}
