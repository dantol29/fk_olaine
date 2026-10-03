"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Award,
  CalendarDays,
  Dumbbell,
  FileText,
  Handshake,
  ImageIcon,
  LogOut,
  Menu,
  MessageCircleQuestion,
  Newspaper,
  Settings,
  Trophy,
  UserRound,
  Users,
  Volleyball,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { logout } from "@/app/admin/login/actions";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/teams", label: "Komandas", icon: Users },
  { href: "/admin/players", label: "Spēlētāji", icon: UserRound },
  { href: "/admin/coaches", label: "Treneri", icon: Award },
  { href: "/admin/trainings", label: "Treniņi", icon: Dumbbell },
  { href: "/admin/events", label: "Notikumi", icon: CalendarDays },
  { href: "/admin/games", label: "Spēles", icon: Volleyball },
  { href: "/admin/league-sources", label: "Līgu avoti", icon: Trophy },
  { href: "/admin/club-pages", label: "Kluba lapas", icon: FileText },
  { href: "/admin/club-logos", label: "Klubu logo", icon: ImageIcon },
  { href: "/admin/partners", label: "Partneri", icon: Handshake },
  { href: "/admin/aptaujas", label: "Aptaujas", icon: MessageCircleQuestion },
  { href: "/admin/jaunumi", label: "Jaunumi", icon: Newspaper },
  { href: "/admin/site-settings", label: "Iestatījumi", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div>
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3">
          <Image
            src="/fk-olaine-crest-v2.png"
            alt="FK Olaine"
            width={80}
            height={83}
            className="h-14 w-auto"
          />
          <span><span className="block text-xl font-semibold">FK OLAINE</span><span className="mt-1 block text-[10px] uppercase tracking-wider text-white/45">Administrācija</span></span>
        </Link>
        <nav aria-label="Administrācijas navigācija" className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 px-3 py-2 text-sm font-medium focus-visible:outline-white",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="mt-8 flex min-h-11 w-full items-center justify-center gap-2 border border-white/25 px-3 py-2 text-xs font-semibold text-white uppercase hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Iziet
        </button>
      </form>
    </>
  );
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between bg-black px-5 py-3 text-white lg:hidden">
        <Link href="/admin" className="flex items-center gap-3"><Image src="/fk-olaine-crest-v2.png" alt="" width={48} height={50} className="h-10 w-auto" /><span className="text-lg font-semibold">FK OLAINE</span></Link>
        <button type="button" onClick={() => setOpen(true)} aria-label="Atvērt izvēlni" className="flex size-11 items-center justify-center focus-visible:outline-white"><Menu className="size-7" /></button>
      </div>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col justify-between overflow-y-auto bg-black p-5 text-white lg:flex">
        <SidebarContent />
      </aside>
      <Drawer swipeDirection="right" open={open} onOpenChange={setOpen}>
        <DrawerContent className="!h-dvh !max-h-dvh !w-[min(100vw,400px)] border-none bg-black text-white shadow-xl data-[swipe-direction=right]:rounded-none motion-reduce:transition-none" overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-3"><DrawerTitle className="text-2xl font-normal text-white">Administrācija</DrawerTitle><DrawerClose aria-label="Aizvērt izvēlni" className="-mr-2 flex size-11 items-center justify-center focus-visible:outline-white"><X className="size-6" /></DrawerClose></div>
          <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><SidebarContent onNavigate={() => setOpen(false)} /></div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
