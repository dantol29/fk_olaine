"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ComponentProps } from "react";
import { ChevronDown, Search, SearchX, UserRound, X } from "lucide-react";

import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import type { SearchResults } from "@/lib/search-server";
import { cn } from "@/lib/utils";

const EMPTY_RESULTS: SearchResults = { articles: [], players: [], coaches: [], teams: [] };

const AUTHORITY_LOGO: Record<"UEFA" | "LFF", string> = {
  UEFA: "/uefa-logo.webp",
  LFF: "/partners/lff.png",
};

export function GlobalSearchDrawer({ triggerClassName, open: controlledOpen, onOpenChange, finalFocus }: {
  triggerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  finalFocus?: ComponentProps<typeof DrawerContent>["finalFocus"];
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  function setOpen(next: boolean) {
    setInternalOpen(next);
    onOpenChange?.(next);
  }
  const [query, setQuery] = useState("");
  const [searchResults, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [isLoading, setIsLoading] = useState(false);

  const [category, setCategory] = useState<"all" | keyof SearchResults>("all");
  const [sort, setSort] = useState("default");
  const results: SearchResults = {
    articles: category === "all" || category === "articles" ? [...searchResults.articles] : [],
    players: category === "all" || category === "players" ? [...searchResults.players] : [],
    coaches: category === "all" || category === "coaches" ? [...searchResults.coaches] : [],
    teams: category === "all" || category === "teams" ? [...searchResults.teams] : [],
  };
  if (sort === "alphabetical") {
    results.articles.sort((a, b) => a.title.localeCompare(b.title, "lv"));
    results.players.sort((a, b) => a.name.localeCompare(b.name, "lv"));
    results.coaches.sort((a, b) => a.name.localeCompare(b.name, "lv"));
    results.teams.sort((a, b) => a.name.localeCompare(b.name, "lv"));
  }

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= 2;

  useEffect(() => {
    if (!open || !hasQuery) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((data: SearchResults) => {
          if (!controller.signal.aborted) setResults(data);
        })
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmed, open, hasQuery]);

  function close() {
    setOpen(false);
    setQuery("");
    setResults(EMPTY_RESULTS);
    setIsLoading(false);
  }

  const hasResults =
    results.teams.length > 0 ||
    results.players.length > 0 ||
    results.coaches.length > 0 ||
    results.articles.length > 0;

  return (
    <Drawer swipeDirection="right" open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DrawerTrigger
        aria-label="Meklēt"
        className={cn(
          "flex items-center justify-center pr-2 text-club-navy sm:pr-3",
          triggerClassName,
        )}
      >
        <Search className="h-7 w-7" />
      </DrawerTrigger>

      <DrawerContent
        finalFocus={finalFocus}
        className="!h-dvh !max-h-dvh !w-[min(100vw,400px)] border-none bg-white shadow-xl data-[swipe-direction=right]:rounded-none motion-reduce:transition-none"
        overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-sm"
      >
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
          <div className="shrink-0 bg-black px-4 pt-[max(0.5rem,env(safe-area-inset-top))] text-white">
            <div className="mb-3 flex items-center justify-between">
              <DrawerTitle className="text-2xl font-normal text-white">Meklēt</DrawerTitle>
              <button type="button" onClick={close} aria-label="Aizvērt meklēšanu" className="-mr-2 flex size-11 items-center justify-center text-white hover:text-white/70 focus-visible:outline-white">
                <X className="size-6" />
              </button>
            </div>
            <div className="flex h-12 items-center gap-3 rounded-full bg-[#1e1c1c] px-4">
              <Search className="size-6 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <input
                autoFocus
                type="search"
                aria-label="Meklēt spēlētājus, komandas un jaunumus"
                value={query}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  setQuery(nextQuery);
                  setResults(EMPTY_RESULTS);
                  setIsLoading(nextQuery.trim().length >= 2);
                }}
                className="min-w-0 flex-1 bg-transparent text-base text-white outline-none"
              />
            </div>
            <div className="flex min-h-12 items-center justify-center gap-4">
              <div className="relative min-w-0">
                <select aria-label="Rezultātu veids" value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="h-11 max-w-full appearance-none bg-black pr-5 text-xs font-semibold uppercase text-white focus-visible:outline-white">
                  <option value="all">Visi rezultāti</option>
                  <option value="articles">Jaunumi</option>
                  <option value="players">Spēlētāji</option>
                  <option value="coaches">Treneri</option>
                  <option value="teams">Komandas</option>
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-0 size-3.5 -translate-y-1/2" aria-hidden="true" />
              </div>
              <span className="h-4 w-px bg-white/70" aria-hidden="true" />
              <div className="relative min-w-0">
                <select aria-label="Kārtot rezultātus" value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 max-w-full appearance-none bg-black pr-5 text-xs font-semibold uppercase text-white focus-visible:outline-white">
                  <option value="default">Pēc atbilstības</option>
                  <option value="alphabetical">Alfabētiski</option>
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-0 size-3.5 -translate-y-1/2" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div aria-live="polite" aria-busy={isLoading && hasQuery} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 text-black pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {!hasQuery ? null : isLoading ? (
              <p className="py-16 text-center text-sm text-black/50">Meklē...</p>
            ) : !hasResults ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="flex size-14 items-center justify-center bg-[#e8e8e8]">
                  <SearchX className="size-6 text-black/50" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-base font-semibold text-black">Nekas netika atrasts</p>
                  <p className="mt-2 text-sm text-black/55">
                    Pamēģini meklēt ar citu vārdu vai nosaukumu.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {results.teams.length > 0 && (
                  <section>
                    <h3 className="mb-3 border-b-2 border-black pb-3 text-xl font-semibold uppercase text-black">Komandas</h3>
                    <div className="flex flex-col divide-y divide-black/10">
                      {results.teams.map((team) => (
                        <Link
                          key={team.id}
                          href="/komandas"
                          onClick={close}
                          className="flex min-h-12 items-center py-3 text-base font-semibold uppercase text-black hover:text-black/60 focus-visible:outline-black"
                        >
                          {team.name}
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {results.players.length > 0 && (
                  <section>
                    <h3 className="mb-3 border-b-2 border-black pb-3 text-xl font-semibold uppercase text-black">Spēlētāji</h3>
                    <div className="flex flex-col divide-y divide-black/10">
                      {results.players.map((player) => (
                        <Link
                          key={player.id}
                          href="/komandas"
                          onClick={close}
                          className="group flex items-center gap-4 py-4 text-black focus-visible:outline-black"
                        >
                          <span className="relative size-20 shrink-0 overflow-hidden bg-[#f5f5f5]">
                            {player.photoUrl ? (
                              <Image
                                src={player.photoUrl}
                                alt={player.name}
                                fill
                                sizes="80px"
                                className="object-contain object-bottom"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center">
                                <UserRound className="size-9 text-black/20" strokeWidth={1.5} />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-lg leading-snug font-semibold uppercase text-black group-hover:text-black/60">
                              {player.name}
                            </span>
                            {player.teamName && (
                              <span className="mt-1 block text-sm text-black/55">
                                {player.teamName}
                              </span>
                            )}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {results.coaches.length > 0 && (
                  <section>
                    <h3 className="mb-3 border-b-2 border-black pb-3 text-xl font-semibold uppercase text-black">Treneri</h3>
                    <div className="flex flex-col divide-y divide-black/10">
                      {results.coaches.map((coach) => (
                        <Link
                          key={coach.id}
                          href="/komandas#roster-staff"
                          onClick={close}
                          className="group flex items-center gap-4 py-4 text-black focus-visible:outline-black"
                        >
                          <span className="relative size-20 shrink-0 overflow-hidden bg-[#f5f5f5]">
                            {coach.photoUrl ? (
                              <Image
                                src={coach.photoUrl}
                                alt={coach.name}
                                fill
                                sizes="80px"
                                className="object-contain object-bottom"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center">
                                <UserRound className="size-9 text-black/20" strokeWidth={1.5} />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-lg leading-snug font-semibold uppercase text-black group-hover:text-black/60">
                              {coach.name}
                            </span>
                            <span className="mt-1 block text-sm text-black/55">{coach.position}</span>
                            <span className="mt-2 flex items-center gap-1.5 text-xs text-black/55">
                              <Image
                                src={AUTHORITY_LOGO[coach.authority]}
                                alt={coach.authority}
                                width={16}
                                height={16}
                                className="size-4 shrink-0 object-contain"
                              />
                              <span className="truncate">{coach.license}</span>
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {results.articles.length > 0 && (
                  <section>
                    <h3 className="mb-3 border-b-2 border-black pb-3 text-xl font-semibold uppercase text-black">Jaunumi</h3>
                    <div className="flex flex-col divide-y divide-black/10">
                      {results.articles.map((article) => (
                        <Link
                          key={article.slug}
                          href={`/jaunumi/${article.slug}`}
                          onClick={close}
                          className="group flex items-start gap-4 py-4 text-black focus-visible:outline-black"
                        >
                          <span className="relative h-20 w-28 shrink-0 overflow-hidden bg-[#e8e8e8]">
                            <Image
                              src={article.image}
                              alt=""
                              fill
                              sizes="112px"
                              className="object-cover"
                            />
                          </span>
                          <span className="min-w-0 flex-1 text-base leading-snug font-semibold text-black group-hover:text-black/60">
                            {article.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
