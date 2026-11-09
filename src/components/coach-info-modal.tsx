"use client";

import { Dialog } from "@base-ui/react/dialog";
import Image from "next/image";
import { UserRound, X } from "lucide-react";

type Coach = {
  name: string;
  position: string;
  photoUrl: string | null;
  license: string;
  authority: "UEFA" | "LFF";
  teamNames: string[];
};

const AUTHORITY_LOGO = { UEFA: "/uefa-logo.webp", LFF: "/partners/lff.png" };

export function CoachInfoModal({ coach, onClose }: { coach: Coach | null; onClose: () => void }) {
  return (
    <Dialog.Root open={Boolean(coach)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 supports-backdrop-filter:backdrop-blur-sm" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[760px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden bg-white text-black shadow-xl outline-none">
          <div className="flex shrink-0 items-center justify-between gap-4 bg-black px-5 py-3 text-white sm:px-6">
            <Dialog.Title className="text-xl font-semibold sm:text-2xl">{coach?.name}</Dialog.Title>
            <Dialog.Close aria-label="Aizvērt" className="-mr-2 flex size-11 shrink-0 items-center justify-center hover:text-white/70 focus-visible:outline-white"><X className="size-6" aria-hidden="true" /></Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Trenera profils, amats, licence un komandas.</Dialog.Description>
          {coach && (
            <div className="min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6">
              <div className="grid items-start gap-6 sm:grid-cols-[240px_minmax(0,1fr)]">
                <div className="relative mx-auto aspect-square w-full max-w-[240px] overflow-hidden bg-[#f5f5f5]">
                  {coach.photoUrl ? <Image src={coach.photoUrl} alt="" fill sizes="240px" className="object-contain object-bottom" /> : <div className="flex h-full items-center justify-center"><UserRound className="size-20 text-black/15" strokeWidth={1} /></div>}
                </div>
                <dl className="grid gap-3 text-base [&>div]:bg-[#f5f5f5] [&>div]:px-4 [&>div]:py-3 [&_dt]:text-xs [&_dt]:uppercase [&_dt]:text-black/50 [&_dd]:mt-1">
                  <div><dt>Amats</dt><dd>{coach.position}</dd></div>
                  <div><dt>Licence</dt><dd className="flex items-center gap-2"><Image src={AUTHORITY_LOGO[coach.authority]} alt={coach.authority} width={24} height={24} className="size-6 shrink-0 object-contain" />{coach.license}</dd></div>
                  <div><dt>Komandas</dt><dd>{coach.teamNames.length ? coach.teamNames.join(", ") : "—"}</dd></div>
                </dl>
              </div>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
