"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Mail, Menu, Phone, Search, UserRound, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { GlobalSearchDrawer } from "@/components/global-search-drawer";
import { JoinClubDrawer } from "@/components/join-club-drawer";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { FacebookIcon, InstagramIcon } from "@/components/social-icons";
import type { HeaderMatch } from "@/lib/games-server";

type NavItem = {
  title: string;
  href: string;
};

const BASE_NAV_ITEMS: NavItem[] = [
  { title: "Sākums", href: "/" },
  { title: "Jaunumi", href: "/jaunumi" },
  { title: "Spēles", href: "/speles" },
  { title: "Komandas", href: "/komandas" },
  { title: "Treniņi", href: "/treninji" },
  { title: "Kalendārs", href: "/kalendars" },
  { title: "Kontakti", href: "/kontakti" },
];

export function SiteHeaderClient({
  phone,
  email,
  clubPages,
  nextMatch,
  overlay = false,
}: {
  phone: string;
  email: string;
  clubPages: { title: string; href: string }[];
  nextMatch: HeaderMatch | null;
  overlay?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [returnToMenu, setReturnToMenu] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const compactMenuRef = useRef<HTMLButtonElement>(null);
  const compactSearchRef = useRef<HTMLButtonElement>(null);
  const [compactVisible, setCompactVisible] = useState(false);
  const activeMenuRef = compactVisible ? compactMenuRef : menuTriggerRef;

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const hero = document.querySelector<HTMLElement>(".home-hero-stage, .games-page-hero, .teams-page-hero, .trainings-page-hero, .club-page-hero, .contacts-page-hero, .calendar-page-hero, [aria-labelledby='featured-news-heading']");
    let frame = 0;
    const update = () => {
      frame = 0;
      const headerBottom = header.getBoundingClientRect().bottom;
      const heroBottom = (hero ?? header).getBoundingClientRect().bottom;
      setCompactVisible((visible) => visible ? headerBottom < -80 : heroBottom <= 160 && headerBottom < -80);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(onScroll);
    observer.observe(hero ?? header);
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);
  const navItems = BASE_NAV_ITEMS.flatMap((item) =>
    item.title === "Komandas" ? [item, ...clubPages] : [item],
  );
  const desktopNavItems = navItems.filter((item) => item.title !== "Sākums");

  function isActive(item: NavItem) {
    return item.href === pathname;
  }

  const brand = (
    <Link href="/" aria-label="FK Olaine — sākums" className="flex shrink-0 items-center gap-3" onClick={() => setMobileOpen(false)}>
      <Image
        src="/fk-olaine-crest-v2.png"
        alt=""
        width={62}
        height={64}
        priority
        className="h-12 w-auto shrink-0 sm:h-16"
      />
      <span className="flex flex-col gap-1 text-white">
        <span className="text-lg leading-none font-extrabold tracking-tight whitespace-nowrap sm:text-2xl">FK OLAINE</span>
        <span className="text-xs leading-none text-white/75">Futbola klubs</span>
      </span>
    </Link>
  );

  const socialLinks = (
    <>
      <a href="https://www.instagram.com/fkolaine_sievietes/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex size-11 items-center justify-center transition-colors hover:text-club-red">
        <InstagramIcon className="size-5" />
      </a>
      <a href="https://www.facebook.com/afaolaine.sievietes/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex size-11 items-center justify-center transition-colors hover:text-club-red">
        <FacebookIcon className="size-5" />
      </a>
    </>
  );

  const navLinkClass = "relative flex h-11 items-center rounded-md px-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 hover:text-white focus:bg-white/10 focus-visible:ring-white/70";

  return (
    <>
    <header ref={headerRef} data-over-hero={overlay || undefined} className="club-masthead-light relative z-40 text-white [&_a:focus-visible]:outline-white [&_button:focus-visible]:outline-white">
      <div className="club-header-account flex h-12 items-center justify-between gap-4 bg-white px-[clamp(24px,3vw,64px)] text-black">
        <div className="min-w-0">
          {nextMatch && (
            <Link href="/speles" title={nextMatch.label} aria-label={`Nākamā spēle: ${nextMatch.label}`} className="flex h-10 items-center gap-3">
              <span className="shrink-0 text-xs font-semibold sm:text-sm">Nākamā spēle:</span>
              {[nextMatch.home, nextMatch.away].map((team, index) => (
                <span key={index} className="flex shrink-0 items-center gap-3">
                  {index === 1 && <span aria-hidden="true" className="text-sm font-semibold">:</span>}
                  {team.logo ? <Image src={team.logo} alt="" width={28} height={28} className="size-7 object-contain" /> : <span aria-hidden="true" className={cn("flex size-7 items-center justify-center rounded-full text-[10px] font-semibold text-white", team.color)}>{team.initials}</span>}
                </span>
              ))}
              <span className="min-w-0 truncate text-xs sm:text-sm">{nextMatch.date} · {nextMatch.time}{nextMatch.venue && ` · ${nextMatch.venue}`}</span>
            </Link>
          )}
        </div>
        <Link href="/admin/login" className="inline-flex h-10 shrink-0 items-center gap-2 text-sm font-medium hover:underline"><UserRound className="size-4" aria-hidden="true" />Log in</Link>
      </div>
      <div className="club-masthead-inner w-full">
        <Link href="/" aria-label="FK Olaine — sākums" className="club-crest-badge" onClick={() => setMobileOpen(false)}>
          <Image src="/fk-olaine-crest-v2.png" alt="" width={124} height={128} priority className="shrink-0" />
          <span className="club-header-name">FK OLAINE</span>
        </Link>

        <div className="club-header-navigation-row">
          <button
            ref={menuTriggerRef}
            type="button"
            aria-label="Atvērt izvēlni"
            aria-haspopup="dialog"
            aria-expanded={mobileOpen}
            aria-controls="club-navigation-drawer"
            onClick={() => setMobileOpen(true)}
            className="club-header-menu flex size-11 shrink-0 items-center justify-center"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <NavigationMenu aria-label="Galvenā navigācija" className="club-masthead-nav hidden max-w-none flex-1 justify-start lg:flex">
            <NavigationMenuList className="gap-0.5">
              {desktopNavItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink href={item.href} aria-current={isActive(item) ? "page" : undefined} className={navLinkClass}>
                    {item.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="club-masthead-actions flex shrink-0 items-center gap-1 sm:gap-2">
          <GlobalSearchDrawer open={searchOpen} onOpenChange={(next) => { if (next) setReturnToMenu(false); setSearchOpen(next); }} finalFocus={returnToMenu ? activeMenuRef : compactVisible ? compactSearchRef : undefined} triggerClassName="size-11 rounded-md p-0 text-white sm:pr-0 [&_svg]:size-5" />
          <JoinClubDrawer open={joinOpen} onOpenChange={(next) => { if (next) setReturnToMenu(false); setJoinOpen(next); }} finalFocus={activeMenuRef} triggerClassName="hidden">
            Pievienojies <ArrowRight className="size-4" aria-hidden="true" />
          </JoinClubDrawer>

          <Drawer open={mobileOpen} onOpenChange={setMobileOpen} swipeDirection="up">
            <DrawerContent id="club-navigation-drawer" finalFocus={activeMenuRef} className="rounded-none border-0 bg-white shadow-none data-[swipe-axis=y]:[--drawer-content-max-height:100dvh]" overlayClassName="bg-club-navy/60 supports-backdrop-filter:backdrop-blur-none">
              <DrawerTitle className="sr-only">Galvenā navigācija</DrawerTitle>
              <div className="flex min-h-0 flex-col overflow-y-auto overscroll-contain">
                <div className="flex h-20 shrink-0 items-center justify-between gap-5 bg-club-navy px-5 sm:h-24 sm:px-8">
                  {brand}
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label="Meklēt" onClick={() => { setReturnToMenu(true); setMobileOpen(false); setSearchOpen(true); }} className="flex size-11 items-center justify-center rounded-md text-white focus-visible:outline-white">
                      <Search className="size-5" aria-hidden="true" />
                    </button>
                    <DrawerClose aria-label="Aizvērt izvēlni" className="flex size-11 items-center justify-center rounded-md text-white hover:bg-white/10 focus-visible:outline-white">
                      <X className="size-6" aria-hidden="true" />
                    </DrawerClose>
                  </div>
                </div>
                <nav aria-label="Mobilā navigācija" className="px-5 sm:px-8">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} aria-current={isActive(item) ? "page" : undefined} className={cn("flex min-h-14 items-center justify-between gap-4 border-b border-club-navy/10 py-3 text-base font-semibold text-club-navy hover:text-club-red", isActive(item) && "text-club-red")}>
                      {item.title} <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  ))}
                </nav>
                <div className="px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8">
                  <button type="button" onClick={() => { setReturnToMenu(true); setMobileOpen(false); setJoinOpen(true); }} className="flex min-h-12 w-full items-center justify-between gap-4 rounded-md bg-club-red px-4 text-base font-semibold text-white hover:bg-club-red-dark">
                    Pievienojies <ArrowRight className="size-5" aria-hidden="true" />
                  </button>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-club-navy">
                    <div className="flex min-w-0 flex-col">
                      <a href={`tel:${phone.replace(/\s+/g, "")}`} className="flex min-h-11 items-center gap-2.5 text-sm hover:text-club-red"><Phone className="size-4 shrink-0" aria-hidden="true" />{phone}</a>
                      <a href={`mailto:${email}`} className="flex min-h-11 items-center gap-2.5 text-sm hover:text-club-red"><Mail className="size-4 shrink-0" aria-hidden="true" /><span className="break-all">{email}</span></a>
                    </div>
                    <div className="flex items-center">{socialLinks}</div>
                  </div>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </header>
    <header aria-label="Kompaktā navigācija" aria-hidden={!compactVisible} inert={!compactVisible} data-visible={compactVisible || undefined} className="club-compact-header fixed inset-x-0 top-0 z-40 flex h-20 items-center gap-4 bg-black px-[clamp(24px,5vw,106px)] text-white">
      <Link href="/" aria-label="FK Olaine — sākums" className="flex shrink-0 items-center gap-2">
        <Image src="/fk-olaine-crest-v2.png" alt="" width={48} height={50} className="h-12 w-auto" />
      </Link>
      <button ref={compactMenuRef} type="button" aria-label="Atvērt izvēlni" aria-haspopup="dialog" aria-expanded={mobileOpen} aria-controls="club-navigation-drawer" onClick={() => setMobileOpen(true)} className="flex size-11 shrink-0 items-center justify-center hover:bg-white/10"><Menu className="size-7" aria-hidden="true" /></button>
      <nav aria-label="Ātrā navigācija" className="no-scrollbar hidden min-w-0 flex-1 items-center gap-6 overflow-x-auto xl:flex">
        {desktopNavItems.map((item) => <Link key={item.href} href={item.href} aria-current={isActive(item) ? "page" : undefined} className="shrink-0 py-3 text-[15px] font-semibold whitespace-nowrap uppercase hover:text-white/70">{item.title}</Link>)}
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button ref={compactSearchRef} type="button" aria-label="Meklēt" onClick={() => { setReturnToMenu(false); setSearchOpen(true); }} className="flex size-11 items-center justify-center"><Search className="size-7" aria-hidden="true" /></button>
      </div>
    </header>
    </>
  );
}
