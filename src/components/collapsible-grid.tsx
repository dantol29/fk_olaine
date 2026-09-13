"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Clips its grid children to roughly 2 rows (a sliver of the next row still
 *  peeking through under a fade) and reveals the rest behind a "Skatīt
 *  vairāk" button — only when the content actually overflows that height,
 *  so a short list never shows a pointless button. */
export function CollapsibleGrid({
  children,
  gridClassName,
  collapsedClassName,
  fadeFromClassName = "from-white",
  moreHref,
}: {
  children: ReactNode;
  /** The grid's own layout classes (columns/gaps) — kept separate from the
   *  collapsed max-height so callers can vary column counts per breakpoint
   *  freely. */
  gridClassName: string;
  /** max-height (+ any breakpoint variants) applied while collapsed. */
  collapsedClassName: string;
  /** Tailwind `from-*` class for the bottom fade — should match whatever
   *  background sits behind the grid. */
  fadeFromClassName?: string;
  /** When set, the "Skatīt vairāk" affordance links here instead of
   *  expanding in place. */
  moreHref?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setCanExpand(el.scrollHeight > el.clientHeight + 2);
  }, []);

  return (
    <div>
      <div className="relative">
        <div
          ref={ref}
          className={cn(gridClassName, !expanded && cn("overflow-hidden", collapsedClassName))}
        >
          {children}
        </div>
        {canExpand && !expanded && (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t to-transparent",
              fadeFromClassName,
            )}
          />
        )}
      </div>
      {canExpand && !expanded && (
        <div className="mt-4 flex justify-end">
          {moreHref ? (
            <Link
              href={moreHref}
              className="flex items-center gap-2 rounded-full border border-slate-200 py-1.5 pr-1.5 pl-4 text-sm font-semibold text-club-navy transition-colors hover:border-slate-300"
            >
              Skatīt vairāk
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 sm:h-8 sm:w-8">
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 -rotate-90" />
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex items-center gap-2 rounded-full border border-slate-200 py-1.5 pr-1.5 pl-4 text-sm font-semibold text-club-navy transition-colors hover:border-slate-300"
            >
              Skatīt vairāk
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 sm:h-8 sm:w-8">
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
