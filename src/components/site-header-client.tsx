"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { GlobalSearchDrawer } from "@/components/global-search-drawer";
import { JoinClubDrawer } from "@/components/join-club-drawer";
import { LoginDrawer } from "@/components/login-drawer";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { YouTubeIcon } from "@/components/social-icons";
import type { HeaderLinkSettings } from "@/lib/site-settings";

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
  clubPages,
  headerLinks,
  overlay = false,
}: {
  clubPages: { title: string; href: string }[];
  headerLinks: HeaderLinkSettings;
  overlay?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [returnToMenu, setReturnToMenu] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLButtonElement>(null);
  const joinStripeRef = useRef<HTMLAnchorElement>(null);
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const compactMenuRef = useRef<HTMLButtonElement>(null);
  const compactSearchRef = useRef<HTMLButtonElement>(null);
  const [compactVisible, setCompactVisible] = useState(false);
  const activeMenuRef = () => compactVisible ? compactMenuRef.current : mobileMenuRef.current?.getClientRects().length ? mobileMenuRef.current : menuTriggerRef.current;

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
    return item.href === pathname || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
  }

  const navLinkClass = "club-header-nav-link relative flex h-11 items-center rounded-md px-2.5 text-sm font-semibold text-white focus-visible:ring-white/70";

  return (
    <>
    <header ref={headerRef} data-over-hero={overlay || undefined} className="club-masthead-light relative z-40 text-white [&_a:focus-visible]:outline-white [&_button:focus-visible]:outline-white">
      <div className="club-header-account flex h-11 items-center justify-between gap-4 bg-white text-black">
        <nav aria-label="Ātrās saites" className="flex h-full min-w-0 items-center">
          <Link href="/" className="flex h-full shrink-0 items-center justify-center bg-club-red px-6 text-xs font-semibold text-white uppercase sm:px-8 sm:text-sm">FKOLAINE.COM</Link>
          <div className="flex h-8 items-center divide-x divide-black/15">
            <a href={headerLinks.headerTvUrl} target={/^https?:\/\//i.test(headerLinks.headerTvUrl) ? "_blank" : undefined} rel="noopener noreferrer" className="flex h-full items-center px-3 text-xs font-semibold uppercase hover:text-club-red sm:px-6 lg:px-8 lg:text-sm">{headerLinks.headerTvName}</a>
            <a ref={joinStripeRef} href={headerLinks.headerJoinUrl} target={/^https?:\/\//i.test(headerLinks.headerJoinUrl) ? "_blank" : undefined} rel="noopener noreferrer" onClick={(event) => { if (headerLinks.headerJoinUrl === "#pievienojies") { event.preventDefault(); setReturnToMenu(false); setJoinOpen(true); } }} className="hidden h-full items-center px-6 text-xs font-semibold uppercase hover:text-club-red sm:flex lg:px-8 lg:text-sm">{headerLinks.headerJoinName}</a>
            <a href={headerLinks.headerFederationUrl} target={/^https?:\/\//i.test(headerLinks.headerFederationUrl) ? "_blank" : undefined} rel="noopener noreferrer" className="hidden h-full items-center px-6 text-xs font-semibold uppercase hover:text-club-red sm:flex lg:px-8 lg:text-sm">{headerLinks.headerFederationName}</a>
          </div>
        </nav>
        <LoginDrawer />
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
            className="club-header-menu hidden size-11 shrink-0 items-center justify-center lg:flex"
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
          <button ref={mobileMenuRef} type="button" aria-label="Atvērt izvēlni" aria-haspopup="dialog" aria-expanded={mobileOpen} aria-controls="club-navigation-drawer" onClick={() => setMobileOpen(true)} className="flex size-11 shrink-0 items-center justify-center lg:hidden"><Menu className="size-5" aria-hidden="true" /></button>
          <JoinClubDrawer open={joinOpen} onOpenChange={(next) => { if (next) setReturnToMenu(false); setJoinOpen(next); }} finalFocus={returnToMenu ? activeMenuRef : joinStripeRef} triggerClassName="hidden">
            Pievienojies <ArrowRight className="size-4" aria-hidden="true" />
          </JoinClubDrawer>

          <Drawer open={mobileOpen} onOpenChange={setMobileOpen} swipeDirection="up">
            <DrawerContent id="club-navigation-drawer" finalFocus={activeMenuRef} className="!h-dvh !max-h-dvh !rounded-none border-0 bg-black text-white shadow-none data-[swipe-axis=y]:[--drawer-content-max-height:100dvh] motion-reduce:transition-none" overlayClassName="bg-black supports-backdrop-filter:backdrop-blur-none">
              <DrawerTitle className="sr-only">Galvenā navigācija</DrawerTitle>
              <div className="flex h-full min-h-0 flex-col bg-black text-white">
                <div className="flex h-20 shrink-0 items-center justify-between px-4 sm:px-6">
                  <DrawerClose aria-label="Aizvērt izvēlni" className="flex size-12 items-center justify-center text-white focus-visible:outline-white"><X className="size-9" strokeWidth={1.5} aria-hidden="true" /></DrawerClose>
                  <button type="button" aria-label="Meklēt" onClick={() => { setReturnToMenu(true); setMobileOpen(false); setSearchOpen(true); }} className="flex size-12 items-center justify-center text-white focus-visible:outline-white"><Search className="size-8" strokeWidth={1.5} aria-hidden="true" /></button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-7 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-10">
                  <nav aria-label="Mobilā navigācija" className="flex flex-col items-start">
                    {desktopNavItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} aria-current={isActive(item) ? "page" : undefined} className="club-header-nav-link flex min-h-18 items-center py-4 text-2xl leading-tight font-semibold text-white uppercase focus-visible:outline-white sm:text-3xl">{item.title}</Link>)}
                  </nav>
                  <nav aria-label="Papildu saites" className="mt-12 flex flex-col items-start">
                    <a href="https://www.youtube.com/c/avanakeks/videos" target="_blank" rel="noopener noreferrer" className="flex min-h-18 items-center gap-3 py-4 text-2xl font-semibold uppercase hover:text-white/70 focus-visible:outline-white sm:text-3xl">Kluba video <YouTubeIcon className="size-9 text-club-red" aria-hidden="true" /></a>
                    <a href="https://lff.lv/" target="_blank" rel="noopener noreferrer" className="flex min-h-18 items-center py-4 text-2xl font-semibold uppercase hover:text-white/70 focus-visible:outline-white sm:text-3xl">Federācija</a>
                    <button type="button" onClick={() => { setReturnToMenu(true); setMobileOpen(false); setJoinOpen(true); }} className="flex min-h-18 items-center py-4 text-2xl font-semibold uppercase hover:text-white/70 focus-visible:outline-white sm:text-3xl">Pievienojies</button>
                  </nav>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </header>
    <header aria-label="Kompaktā navigācija" aria-hidden={!compactVisible} inert={!compactVisible} data-visible={compactVisible || undefined} className="club-compact-header fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-2 bg-black px-4 text-white lg:h-20 lg:gap-4 lg:px-[clamp(24px,5vw,106px)]">
      <Link href="/" aria-label="FK Olaine — sākums" className="flex shrink-0 items-center gap-2">
        <Image src="/fk-olaine-crest-v2.png" alt="" width={48} height={50} className="h-9 w-auto lg:h-12" />
        <span className="text-lg font-semibold whitespace-nowrap lg:hidden">FK OLAINE</span>
      </Link>
      <button ref={compactMenuRef} type="button" aria-label="Atvērt izvēlni" aria-haspopup="dialog" aria-expanded={mobileOpen} aria-controls="club-navigation-drawer" onClick={() => setMobileOpen(true)} className="order-3 flex size-11 shrink-0 items-center justify-center hover:bg-white/10 lg:order-none"><Menu className="size-7" aria-hidden="true" /></button>
      <nav aria-label="Ātrā navigācija" className="no-scrollbar hidden min-w-0 flex-1 items-center gap-6 overflow-x-auto xl:flex">
        {desktopNavItems.map((item) => <Link key={item.href} href={item.href} aria-current={isActive(item) ? "page" : undefined} className="club-header-nav-link shrink-0 py-3 text-[15px] font-semibold whitespace-nowrap uppercase">{item.title}</Link>)}
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button ref={compactSearchRef} type="button" aria-label="Meklēt" onClick={() => { setReturnToMenu(false); setSearchOpen(true); }} className="flex size-11 items-center justify-center"><Search className="size-7" aria-hidden="true" /></button>
      </div>
    </header>
    </>
  );
}
