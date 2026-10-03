"use client";

import { Search, X } from "lucide-react";
import { useId, useState } from "react";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("lv");
}

export function AdminSearch({ placeholder = "Meklēt…" }: { placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<number | null>(null);
  const id = useId();

  function applySearch(value: string) {
    setQuery(value);
    const needle = normalize(value.trim());
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-admin-search-item]"));

    let visible = 0;
    for (const item of items) {
      const match = !needle || normalize(item.dataset.adminSearchItem ?? item.textContent ?? "").includes(needle);
      item.hidden = !match;
      if (match) visible += 1;
    }

    for (const group of document.querySelectorAll<HTMLElement>("[data-admin-search-group]")) {
      const groupItems = Array.from(group.querySelectorAll<HTMLElement>("[data-admin-search-item]"));
      group.hidden = groupItems.length > 0 && groupItems.every((item) => item.hidden);
    }

    setMatches(items.length > 0 ? visible : null);
  }

  return (
    <div className="mb-5">
      <label htmlFor={id} className="sr-only">Meklēt ierakstos</label>
      <div className="relative max-w-md">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-black/45" />
        <input
          id={id}
          type="search"
          value={query}
          onChange={(event) => applySearch(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-none border border-black/15 bg-white pr-11 pl-10 text-sm text-black shadow-none outline-none placeholder:text-black/45 focus:border-black focus:ring-2 focus:ring-black/10"
        />
        {query && (
          <button type="button" onClick={() => applySearch("")} aria-label="Notīrīt meklēšanu" className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-none text-black/45 hover:bg-[#e8e8e8] hover:text-black">
            <X className="size-4" />
          </button>
        )}
      </div>
      {query && matches === 0 && (
        <p role="status" className="mt-3 rounded-none bg-white p-5 text-center text-sm text-black/45 shadow-none">
          Nekas netika atrasts.
        </p>
      )}
    </div>
  );
}
