"use client";

import { Dialog } from "@base-ui/react/dialog";
import Image from "next/image";
import { UserRound, X } from "lucide-react";

import type { getTeamsRoster } from "@/components/home-teams-section";
import { nationalityFlagImage, nationalityName } from "@/lib/nationality";

type Player = Awaited<ReturnType<typeof getTeamsRoster>>[number]["players"][number];
const POSITIONS: Record<string, string> = {
  goalkeeper: "Vārtsargs", defender: "Aizsargs", midfielder: "Pussargs", forward: "Uzbrucējs",
};

export function PlayerInfoModal({ player, onClose }: { player: Player | null; onClose: () => void }) {
  return (
    <Dialog.Root open={Boolean(player)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 supports-backdrop-filter:backdrop-blur-sm" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[760px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden bg-white text-black shadow-xl outline-none">
          <div className="flex shrink-0 items-center justify-between gap-4 bg-black px-5 py-3 text-white sm:px-6">
            <Dialog.Title className="text-xl font-semibold sm:text-2xl">{player?.name}</Dialog.Title>
            <Dialog.Close aria-label="Aizvērt" className="-mr-2 flex size-11 shrink-0 items-center justify-center hover:text-white/70 focus-visible:outline-white"><X className="size-6" aria-hidden="true" /></Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Spēlētāja profils, pozīcija un komandas.</Dialog.Description>
          {player && (
            <div className="min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6">
              <div className="grid items-start gap-6 sm:grid-cols-[240px_minmax(0,1fr)]">
                <div className="relative mx-auto aspect-square w-full max-w-[240px] overflow-hidden bg-[#f5f5f5]">
                  {player.photoUrl ? <Image src={player.photoUrl} alt="" fill sizes="240px" className="object-contain object-bottom" /> : <div className="flex h-full items-center justify-center"><UserRound className="size-20 text-black/15" strokeWidth={1} /></div>}
                </div>
                <dl className="grid gap-3 text-base [&>div]:bg-[#f5f5f5] [&>div]:px-4 [&>div]:py-3 [&_dt]:text-xs [&_dt]:uppercase [&_dt]:text-black/50 [&_dd]:mt-1">
                  <div><dt>Pozīcija</dt><dd>{POSITIONS[player.position ?? "defender"] ?? "Aizsargs"}</dd></div>
                  <div><dt>Dzimšanas datums</dt><dd>{player.birthdate}</dd></div>
                  <div><dt>Pilsonība</dt><dd className="flex items-center gap-2"><Image src={nationalityFlagImage(player.nationality)} alt="" width={80} height={48} className="h-5 w-7 object-cover" />{nationalityName(player.nationality)}</dd></div>
                  {player.number != null && <div><dt>Numurs</dt><dd>{player.number}</dd></div>}
                  <div><dt>Komandas un gūtie vārti</dt><dd className="space-y-1">{player.teams.map((team) => <p key={team.name}>{team.name} — {team.goals}</p>)}</dd></div>
                </dl>
              </div>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
