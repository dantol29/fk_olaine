"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Award,
  CalendarDays,
  Dumbbell,
  Handshake,
  ImageIcon,
  LogOut,
  Menu,
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
import { logout } from "@/app/admin/login/actions";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/teams", label: "Komandas", icon: Users },
  { href: "/admin/players", label: "Spēlētāji", icon: UserRound },
  { href: "/admin/coaches", label: "Treneri", icon: Award },
  { href: "/admin/trainings", label: "Treniņi", icon: Dumbbell },
  { href: "/admin/events", label: "Notikumi", icon: CalendarDays },
  { href: "/admin/games", label: "Spēles", icon: Volleyball },
  { href: "/admin/league-sources", label: "Līgu avoti", icon: Trophy },
  { href: "/admin/club-logos", label: "Klubu logo", icon: ImageIcon },
  { href: "/admin/partners", label: "Partneri", icon: Handshake },
  { href: "/admin/jaunumi", label: "Jaunumi", icon: Newspaper },
  { href: "/admin/site-settings", label: "Iestatījumi", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div>
        <Link href="/admin" onClick={onNavigate}>
          <Image
            src="/fk-olaine-crest-v2.png"
            alt="FK Olaine"
            width={80}
            height={83}
            className="h-20 w-auto"
          />
        </Link>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-club-red/10 text-club-red"
                    : "text-club-navy hover:bg-club-gray-light",
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
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-club-navy transition hover:bg-club-gray-light"
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
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4 lg:hidden">
        <Link href="/admin">
          <Image
            src="/fk-olaine-crest-v2.png"
            alt="FK Olaine"
            width={80}
            height={83}
            className="h-10 w-auto"
          />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Atvērt izvēlni"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-6 lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile slide-out menu */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex h-full w-64 flex-col justify-between bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Aizvērt izvēlni"
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
