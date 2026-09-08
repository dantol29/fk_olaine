"use client";

import { Mail, Phone } from "lucide-react";
import type { ReactNode } from "react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export function JoinClubDrawer({
  children,
  triggerClassName,
}: {
  children: ReactNode;
  triggerClassName?: string;
}) {
  return (
    <Drawer>
      <DrawerTrigger className={triggerClassName}>{children}</DrawerTrigger>
      <DrawerContent className="border-none bg-transparent shadow-none">
        <div className="mx-auto w-full max-w-md rounded-t-2xl border border-border bg-popover p-4 shadow-lg">
          <DrawerHeader className="p-0">
            <DrawerTitle>Pievienojies FK Olaine</DrawerTitle>
            <DrawerDescription>
              Vēlies spēlēt vai trenēties pie mums? Sazinies ar klubu, un mēs
              palīdzēsim atrast piemērotāko komandu.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="p-0 pt-4">
            <a
              href="mailto:info@afaolaine.lv"
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-club-navy transition hover:bg-club-gray-light"
            >
              <Mail className="h-4 w-4 shrink-0 text-club-red" />
              info@afaolaine.lv
            </a>
            <a
              href="tel:+37129332883"
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-club-navy transition hover:bg-club-gray-light"
            >
              <Phone className="h-4 w-4 shrink-0 text-club-red" />
              +371 29332883
            </a>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
