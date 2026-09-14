"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, SearchX, UserRound, X } from "lucide-react";

import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import type { SearchResults } from "@/lib/search-server";

const EMPTY_RESULTS: SearchResults = { articles: [], players: [], coaches: [], teams: [] };

const AUTHORITY_LOGO: Record<"UEFA" | "LFF", string> = {
  UEFA: "/uefa-logo.webp",
  LFF: "/partners/lff.png",
};

export function GlobalSearchDrawer() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [isLoading, setIsLoading] = useState(false);

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= 2;

  useEffect(() => {
    if (!open || !hasQuery) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((data: SearchResults) => setResults(data))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmed, open, hasQuery]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  const hasResults =
    results.teams.length > 0 ||
    results.players.length > 0 ||
    results.coaches.length > 0 ||
    results.articles.length > 0;

  return (
    <Drawer open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DrawerTrigger
        aria-label="Meklēt"
        className="flex items-center justify-center pr-2 text-club-navy transition-colors hover:text-club-red sm:pr-3"
      >
        <Search className="h-7 w-7" />
      </DrawerTrigger>

      <DrawerContent
        className="border-none bg-transparent shadow-none"
        overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-lg"
      >
        <div className="mx-auto flex h-[80vh] max-h-[720px] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl">
          <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 p-4 sm:p-6">
            <Search className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                setIsLoading(nextQuery.trim().length >= 2);
              }}
              placeholder="Meklēt spēlētājus, komandas, jaunumus..."
              className="min-w-0 flex-1 text-base text-club-navy outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={close}
              aria-label="Aizvērt meklēšanu"
              className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-400 transition hover:text-club-navy"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {!hasQuery ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <Search className="h-6 w-6 text-slate-400" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-club-navy">Meklē FK Olaine</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Spēlētāji, treneri, komandas un jaunumi vienuviet.
                  </p>
                </div>
              </div>
            ) : isLoading ? (
              <p className="py-16 text-center text-sm text-slate-400">Meklē...</p>
            ) : !hasResults ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <SearchX className="h-6 w-6 text-slate-400" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-club-navy">Nekas netika atrasts</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Pamēģini meklēt ar citu vārdu vai nosaukumu.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {results.teams.length > 0 && (
                  <section>
                    <h3 className="mb-2 text-xs font-semibold text-slate-400">Komandas</h3>
                    <div className="flex flex-col gap-1">
                      {results.teams.map((team) => (
                        <Link
                          key={team.id}
                          href="/komandas"
                          onClick={close}
                          className="rounded-lg px-2 py-2 text-sm font-semibold text-club-navy hover:bg-slate-50"
                        >
                          {team.name}
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {results.players.length > 0 && (
                  <section>
                    <h3 className="mb-2 text-xs font-semibold text-slate-400">Spēlētāji</h3>
                    <div className="flex flex-col divide-y divide-slate-100">
                      {results.players.map((player) => (
                        <Link
                          key={player.id}
                          href="/komandas"
                          onClick={close}
                          className="flex items-center gap-4 rounded-xl px-2 py-3 transition hover:bg-slate-50"
                        >
                          <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-club-gray-light sm:h-28 sm:w-28">
                            {player.photoUrl ? (
                              <Image
                                src={player.photoUrl}
                                alt={player.name}
                                fill
                                sizes="(min-width: 640px) 112px, 96px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center">
                                <UserRound className="h-9 w-9 text-club-muted" strokeWidth={1.5} />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-lg font-semibold text-club-navy">
                              {player.name}
                            </span>
                            {player.teamName && (
                              <span className="block truncate text-sm text-slate-400">
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
                    <h3 className="mb-2 text-xs font-semibold text-slate-400">Treneri</h3>
                    <div className="flex flex-col divide-y divide-slate-100">
                      {results.coaches.map((coach) => (
                        <Link
                          key={coach.id}
                          href="/treneri"
                          onClick={close}
                          className="flex items-center gap-4 rounded-xl px-2 py-3 transition hover:bg-slate-50"
                        >
                          <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-club-gray-light sm:h-28 sm:w-28">
                            {coach.photoUrl ? (
                              <Image
                                src={coach.photoUrl}
                                alt={coach.name}
                                fill
                                sizes="(min-width: 640px) 112px, 96px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center">
                                <UserRound className="h-9 w-9 text-club-muted" strokeWidth={1.5} />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-lg font-semibold text-club-navy">
                              {coach.name}
                            </span>
                            <span className="block truncate text-sm text-slate-400">{coach.position}</span>
                            <span className="mt-1 flex items-center gap-1.5 text-xs text-club-navy">
                              <Image
                                src={AUTHORITY_LOGO[coach.authority]}
                                alt={coach.authority}
                                width={16}
                                height={16}
                                className="h-4 w-4 shrink-0 rounded-full object-contain"
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
                    <h3 className="mb-2 text-xs font-semibold text-slate-400">Jaunumi</h3>
                    <div className="flex flex-col gap-1">
                      {results.articles.map((article) => (
                        <Link
                          key={article.slug}
                          href={`/jaunumi/${article.slug}`}
                          onClick={close}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
                        >
                          <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-club-gray-light">
                            <Image
                              src={article.image}
                              alt=""
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-club-navy">
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
