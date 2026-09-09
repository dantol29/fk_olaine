"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { JoinClubDrawer } from "@/components/join-club-drawer";
import { Button } from "@/components/ui/button";
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
      { title: "Stadions", href: "/klubs/stadions" },
    ],
  },
  { title: "Treniņi", href: "/?type=training#kalendars" },
  { title: "Spēles", href: "/?type=game#kalendars" },
  { title: "Jaunumi", href: "/jaunumi" },
  { title: "Kontakti", href: "#footer" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="relative z-40">
      <div className="relative mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-6 sm:h-24">
        <div className="w-[110px] shrink-0" />

        <Image
          src="/fk-olaine-crest-v2.png"
          alt="FK Olaine"
          width={135}
          height={140}
          priority
          className="absolute top-4 left-6 z-40 h-24 w-auto drop-shadow-lg sm:left-12 sm:h-28"
        />

        <NavigationMenu className="hidden max-w-none flex-1 justify-center px-20 lg:flex">
          <NavigationMenuList className="w-full justify-between">
            {NAV_ITEMS.map((item) =>
              item.items ? (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuTrigger className="text-base font-semibold text-black hover:text-club-red data-popup-open:text-club-red">
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
                        : "text-black hover:text-club-red",
                    )}
                  >
                    {item.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ),
            )}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center justify-end gap-2 pr-2 sm:gap-3 sm:pr-4">
          <a
            href="#"
            aria-label="Instagram"
            className="flex items-center justify-center text-club-navy transition-colors hover:text-club-red"
          >
            <InstagramIcon className="h-8 w-8" />
          </a>
          <a
            href="#"
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
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Aizvērt izvēlni" : "Atvērt izvēlni"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-full z-40 flex flex-col gap-1 border-t border-slate-200 bg-white px-6 py-4 shadow-lg lg:hidden">
          {NAV_ITEMS.map((item) => (
            <div key={item.title} className="py-2">
              {item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center justify-between text-black"
                >
                  <span className="text-sm font-semibold">{item.title}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ) : (
                <p className="text-sm font-semibold text-black">{item.title}</p>
              )}
              {item.items && (
                <div className="mt-2 flex flex-col gap-1 pl-3">
                  {item.items.map((sub) => (
                    <Link
                      key={sub.title}
                      href={sub.href}
                      className="flex items-center justify-between py-1 text-sm text-muted-foreground"
                    >
                      <span>{sub.title}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
