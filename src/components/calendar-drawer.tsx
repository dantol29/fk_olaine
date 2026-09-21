"use client";

import type { ReactNode } from "react";

import { Drawer, DrawerContent } from "@/components/ui/drawer";

/** Shared bottom-sheet shell for every calendar detail view. */
export function CalendarDrawer({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-none bg-transparent shadow-none">
        <div className="mx-auto w-full max-w-sm rounded-t-2xl border border-border bg-white p-5 text-club-navy shadow-xl">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
