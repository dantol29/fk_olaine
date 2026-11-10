import type { CalendarEvent } from "@/lib/calendar";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function CalendarEventTeams({ team, teamNames, location, className }: Pick<CalendarEvent, "team" | "teamNames"> & { location?: string | null; className?: string }) {
  const names = [...new Set((teamNames?.length ? teamNames : team ? [team] : []).map((name) => name.trim()).filter(Boolean))];
  if (!names.length && !location) return null;
  return <div className={cn("flex flex-wrap items-start justify-between gap-x-5 gap-y-2 text-sm text-black", className)}>
    {location && <p className="flex min-w-0 items-start gap-2 text-left text-black/60"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{location}</span></p>}
    {names.length > 0 && <p className="ml-auto text-right"><span className="text-black/50">{names.length > 1 ? "Komandas" : "Komanda"}:</span> <span className="font-medium">{names.join(", ")}</span></p>}
  </div>;
}
