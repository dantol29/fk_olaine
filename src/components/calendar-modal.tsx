"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function CalendarModal({ open, onOpenChange, title = "Kalendāra notikumi", children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 supports-backdrop-filter:backdrop-blur-sm" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden bg-white text-black shadow-xl outline-none">
          <div className="flex shrink-0 items-center justify-between gap-4 bg-black px-5 py-3 text-white sm:px-6">
            <Dialog.Title className="text-xl font-semibold sm:text-2xl">{title}</Dialog.Title>
            <Dialog.Close aria-label="Aizvērt" className="-mr-2 flex size-11 shrink-0 items-center justify-center hover:text-white/70 focus-visible:outline-white"><X className="size-6" aria-hidden="true" /></Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Spēļu, treniņu un pasākumu informācija.</Dialog.Description>
          <div className="min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
