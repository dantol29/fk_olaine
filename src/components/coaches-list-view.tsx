"use client";

import Image from "next/image";
import { UserRound } from "lucide-react";

import { CollapsibleGrid } from "@/components/collapsible-grid";

const AUTHORITY_LOGO: Record<"UEFA" | "LFF", string> = {
  UEFA: "/uefa-logo.webp",
  LFF: "/partners/lff.png",
};

type Coach = {
  id: number;
  name: string;
  position: string;
  photoUrl: string | null;
  license: string;
  authority: "UEFA" | "LFF";
};

export function CoachesListView({ coaches }: { coaches: Coach[] }) {
  return (
    <CollapsibleGrid
      gridClassName="flex flex-col divide-y divide-slate-100"
      collapsedClassName="max-h-[19rem] sm:max-h-[21rem]"
      fadeFromClassName="from-white"
      moreHref="/treneri"
    >
      {coaches.map((coach) => (
        <div key={coach.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-club-gray-light sm:h-28 sm:w-28">
            {coach.photoUrl ? (
              <Image src={coach.photoUrl} alt={coach.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserRound className="h-9 w-9 text-club-muted" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-club-navy">{coach.name}</p>
            <p className="truncate text-sm text-slate-400">{coach.position}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-club-navy">
              <Image
                src={AUTHORITY_LOGO[coach.authority]}
                alt={coach.authority}
                width={16}
                height={16}
                className="h-4 w-4 shrink-0 rounded-full object-contain"
              />
              <span className="truncate">{coach.license}</span>
            </p>
          </div>
        </div>
      ))}
    </CollapsibleGrid>
  );
}
