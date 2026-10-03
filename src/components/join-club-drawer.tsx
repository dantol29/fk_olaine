"use client";

import { ArrowUpRight, Mail, Phone, X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export function JoinClubDrawer({
  children,
  triggerClassName,
  open,
  onOpenChange,
  finalFocus,
}: {
  children: ReactNode;
  triggerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  finalFocus?: ComponentProps<typeof DrawerContent>["finalFocus"];
}) {
  return (
    <Drawer swipeDirection="right" open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger className={triggerClassName}>{children}</DrawerTrigger>
      <DrawerContent finalFocus={finalFocus} className="!h-dvh !max-h-dvh !w-[min(100vw,400px)] border-none bg-white shadow-xl data-[swipe-direction=right]:rounded-none motion-reduce:transition-none" overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-sm">
        <div className="flex h-full min-h-0 flex-col bg-white text-black">
          <div className="flex shrink-0 items-center justify-between gap-4 bg-black px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-3 text-white">
            <DrawerTitle className="text-2xl font-normal text-white">Pievienojies</DrawerTitle>
            <DrawerClose aria-label="Aizvērt" className="-mr-2 flex size-11 shrink-0 items-center justify-center hover:text-white/70 focus-visible:outline-white"><X className="size-6" /></DrawerClose>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            <div className="bg-black px-4 pt-2 pb-5 text-white">
            <DrawerDescription className="text-sm leading-relaxed text-white/65">
              Vēlies spēlēt vai trenēties pie mums? Sazinies ar klubu, un mēs
              palīdzēsim atrast piemērotāko komandu.
            </DrawerDescription>
            <div className="mt-5 space-y-3">
            <a
              href="mailto:info@fkolaine.com"
              className="group flex min-h-12 items-center gap-3 rounded-full bg-[#1e1c1c] px-4 py-3 hover:bg-[#292727] focus-visible:outline-white"
            >
              <Mail className="size-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 break-words text-base">info@fkolaine.com</span>
              <ArrowUpRight className="size-5 shrink-0" aria-hidden="true" />
            </a>
            <a
              href="tel:+37129332883"
              className="group flex min-h-12 items-center gap-3 rounded-full bg-[#1e1c1c] px-4 py-3 hover:bg-[#292727] focus-visible:outline-white"
            >
              <Phone className="size-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 text-base">+371 29332883</span>
              <ArrowUpRight className="size-5 shrink-0" aria-hidden="true" />
            </a>
            </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
