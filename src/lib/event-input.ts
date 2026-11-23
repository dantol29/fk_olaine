import { richTextHasContent, sanitizeRichText } from "@/lib/rich-text";
import { eventDatesProblem, storedEndDate } from "@/lib/events";

// The admin event form, read and checked on the server. Kept apart from events.ts because the HTML cleaner it uses
// (cheerio) must not end up in pages that run in the browser.

/** Longest description kept, in characters of cleaned HTML. */
export const MAX_DESCRIPTION_LENGTH = 30_000;

/** The ticked teams of a form, each once, in id order. */
export function parseTeamIds(formData: FormData): number[] {
  return [...new Set(formData.getAll("teamIds").map(Number))].filter((id) => Number.isInteger(id) && id > 0).sort((a, b) => a - b);
}

export function parseEventInput(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  // Sent only while "Vairākas dienas" is ticked.
  const endDate = storedEndDate(date, String(formData.get("endDate") ?? ""));
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const rawDescription = String(formData.get("description") ?? "");

  if (!title) return { error: "Nosaukums ir obligāts." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (!startTime) return { error: "Sākuma laiks ir obligāts." } as const;
  if (!endTime) return { error: "Beigu laiks ir obligāts." } as const;
  const datesProblem = eventDatesProblem(date, startTime, endDate, endTime);
  if (datesProblem) return { error: datesProblem } as const;
  if (!location) return { error: "Vieta ir obligāta." } as const;
  if (rawDescription.length > 2 * MAX_DESCRIPTION_LENGTH) return { error: "Apraksts ir pārāk garš." } as const;
  const description = sanitizeRichText(rawDescription);
  if (description.length > MAX_DESCRIPTION_LENGTH) return { error: "Apraksts ir pārāk garš." } as const;

  return {
    title,
    date,
    startTime,
    endDate,
    endTime,
    location,
    notes: notes || null,
    // An editor left with only empty paragraphs counts as no description.
    description: richTextHasContent(description) ? description : null,
    teamIds: parseTeamIds(formData),
  } as const;
}
