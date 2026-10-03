"use client";

import { LockKeyhole, UserRound, X } from "lucide-react";
import { useActionState, useState } from "react";

import { login } from "@/app/admin/login/actions";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return <form action={formAction} className="bg-black px-4 pt-1 pb-4 text-white">
    <label htmlFor="login-password" className="sr-only">Parole</label>
    <div className="flex h-12 items-center gap-3 rounded-full bg-[#1e1c1c] px-4">
      <LockKeyhole className="size-6 shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <input id="login-password" type="password" name="password" placeholder="Parole" required autoComplete="current-password" autoFocus aria-invalid={Boolean(state?.error)} aria-describedby={state?.error ? "login-error" : undefined} className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/50" />
    </div>
    {state?.error && <p id="login-error" role="alert" className="mt-3 text-sm font-medium text-red-400">{state.error}</p>}
    <button type="submit" disabled={pending} className="mt-4 flex min-h-11 w-full items-center justify-center border border-white/30 px-5 text-xs font-semibold text-white uppercase hover:bg-white/10 disabled:opacity-50">{pending ? "Ielogojas..." : "Ielogoties"}</button>
  </form>;
}

export function LoginDrawer({ initiallyOpen = false, onClose, showTrigger = true }: { initiallyOpen?: boolean; onClose?: () => void; showTrigger?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return <Drawer swipeDirection="right" open={open} onOpenChange={(next) => { setOpen(next); if (!next) onClose?.(); }}>
    {showTrigger && <DrawerTrigger className="inline-flex h-10 shrink-0 items-center gap-2 pr-4 text-xs font-semibold uppercase hover:underline sm:text-sm"><UserRound className="size-4" aria-hidden="true" />Log in</DrawerTrigger>}
    <DrawerContent className="!h-dvh !max-h-dvh !w-[min(100vw,400px)] border-none bg-white text-black shadow-xl data-[swipe-direction=right]:rounded-none motion-reduce:transition-none" overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-sm">
      <div className="flex shrink-0 items-center justify-between gap-4 bg-black px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-3 text-white">
        <DrawerTitle className="text-2xl font-normal text-white">Log in</DrawerTitle>
        <DrawerClose aria-label="Aizvērt" className="-mr-2 flex size-11 items-center justify-center hover:text-white/70 focus-visible:outline-white"><X className="size-6" /></DrawerClose>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">{open && <LoginForm />}</div>
    </DrawerContent>
  </Drawer>;
}
