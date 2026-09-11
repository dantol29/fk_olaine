"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, Menu, Phone, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { JoinClubDrawer } from "@/components/join-club-drawer";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { FacebookIcon, InstagramIcon } from "@/components/social-icons";

type NavItem = {
  title: string;
  href?: string;
  items?: { title: string; href: string }[];
};

const NAV_ITEMS: NavItem[] = [
  { title: "Sākums", href: "/" },
  {
    title: "Klubs",
    items: [
      { title: "Komandas", href: "/komandas" },
      { title: "Treneri", href: "/treneri" },
    ],
  },
  { title: "Treniņi", href: "/treninji" },
  { title: "Spēles", href: "/speles" },
  { title: "Jaunumi", href: "/jaunumi" },
  { title: "Kontakti", href: "#footer" },
];

// Mobile menu has no room for a dropdown group — flatten "Klubs" so its
// subsections (Komandas, Treneri, Stadions) show as top-level big titles.
const MOBILE_NAV_ITEMS: { title: string; href: string }[] = NAV_ITEMS.flatMap(
  (item) => (item.items ? item.items : item.href ? [{ title: item.title, href: item.href }] : []),
);

export function SiteHeaderClient({ phone, email }: { phone: string; email: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Drawer open={mobileOpen} onOpenChange={setMobileOpen} swipeDirection="right">
      <header className="relative z-40">
        <div className="relative mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-6 sm:h-24">
          <div className="w-[110px] shrink-0" />

          <Link href="/" className="absolute top-4 left-6 z-40 sm:left-12">
            <Image
              src="/fk-olaine-crest-v2.png"
              alt="FK Olaine"
              width={135}
              height={140}
              priority
              className="h-24 w-auto drop-shadow-lg sm:h-28"
            />
          </Link>

          <NavigationMenu className="hidden max-w-none flex-1 justify-center px-20 lg:flex">
            <NavigationMenuList className="w-full justify-between">
              {NAV_ITEMS.map((item) =>
                item.items ? (
                  <NavigationMenuItem key={item.title}>
                    <NavigationMenuTrigger className="text-base font-semibold text-club-navy hover:text-club-red data-popup-open:text-club-red">
                      {item.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="w-56 p-2">
                      <div className="flex flex-col text-sm">
                        {item.items.map((sub) => (
                          <NavigationMenuLink
                            key={sub.title}
                            href={sub.href}
                            className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted"
                          >
                            <span>{sub.title}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ) : (
                  <NavigationMenuItem key={item.title}>
                    <NavigationMenuLink
                      href={item.href}
                      className={cn(
                        "relative px-3 py-2 text-base font-semibold hover:bg-transparent",
                        item.title === "Sākums"
                          ? "text-club-red after:absolute after:bottom-[-2px] after:left-1/2 after:h-[2px] after:w-8 after:-translate-x-1/2 after:bg-club-red after:content-['']"
                          : "text-club-navy hover:text-club-red",
                      )}
                    >
                      {item.title}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ),
              )}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="mt-4 flex items-center justify-end gap-2 sm:gap-3 sm:pr-2 lg:mt-0 lg:pr-4">
            <a
              href="https://www.instagram.com/fkolaine_sievietes/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex items-center justify-center text-club-navy transition-colors hover:text-club-red"
            >
              <InstagramIcon className="h-8 w-8" />
            </a>
            <a
              href="https://www.facebook.com/afaolaine.sievietes/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex items-center justify-center text-club-navy transition-colors hover:text-club-red"
            >
              <FacebookIcon className="h-8 w-8" />
            </a>
            <JoinClubDrawer triggerClassName="hidden h-auto items-center gap-3 rounded-2xl bg-club-red py-1.5 pr-1.5 pl-5 text-sm font-medium text-white outline-none transition-all select-none hover:bg-club-red-dark active:translate-y-px lg:inline-flex">
              NĀC TRENĒTIES
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-club-red">
                <ArrowRight className="size-5" />
              </span>
            </JoinClubDrawer>
            <DrawerTrigger
              aria-label={mobileOpen ? "Aizvērt izvēlni" : "Atvērt izvēlni"}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light lg:hidden"
            >
              {mobileOpen ? (
                <X className="h-7 w-7" />
              ) : (
                <Menu className="h-7 w-7" />
              )}
            </DrawerTrigger>
          </div>
        </div>

        <DrawerContent className="border-none bg-transparent shadow-none">
          <div className="flex h-full min-h-0 w-full flex-col gap-2 overflow-y-auto bg-white p-6 shadow-xl">
            {MOBILE_NAV_ITEMS.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="relative block min-h-24 py-3 text-club-navy sm:min-h-32"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:text-8xl"
                >
                  {item.title}
                </span>
                <span className="relative text-center text-3xl tracking-[-0.02em] text-club-navy sm:text-left sm:text-4xl">
                  {item.title}
                </span>
              </Link>
            ))}

            <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-4">
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-2.5 text-sm font-semibold text-club-navy"
              >
                <Phone className="h-4 w-4 shrink-0 text-club-red" />
                {phone}
              </a>
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2.5 text-sm font-semibold text-club-navy"
              >
                <Mail className="h-4 w-4 shrink-0 text-club-red" />
                {email}
              </a>
            </div>
          </div>
        </DrawerContent>
      </header>
    </Drawer>
  );
}
