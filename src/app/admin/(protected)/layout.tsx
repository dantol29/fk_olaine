import Link from "next/link";
import type { ReactNode } from "react";

import { logout } from "@/app/admin/login/actions";

const NAV_ITEMS = [
  { href: "/admin/teams", label: "Komandas" },
  { href: "/admin/players", label: "Spēlētāji" },
  { href: "/admin/coaches", label: "Treneri" },
  { href: "/admin/trainings", label: "Treniņi" },
  { href: "/admin/events", label: "Notikumi" },
  { href: "/admin/games", label: "Spēles" },
  { href: "/admin/league-sources", label: "Līgu avoti" },
  { href: "/admin/club-logos", label: "Klubu logo" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-club-gray-light">
      <aside className="flex w-56 shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-6">
        <div>
          <p className="text-sm font-extrabold text-club-navy uppercase">
            FK Olaine admin
          </p>
          <nav className="mt-6 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-club-navy transition hover:bg-club-gray-light"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-club-navy transition hover:bg-club-gray-light"
          >
            Iziet
          </button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
