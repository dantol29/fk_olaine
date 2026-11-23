/** Keep aliases explicit: different fields/courts must not collapse together. */
export function normalizeVenue(value: string) {
  const normalized = value.normalize("NFKC").toLocaleLowerCase("lv").replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
  const aliases = ["olaines pilsētas stadions", "olaines stadions", "olaine stadions"];
  return aliases.includes(normalized) ? "olaines-pilsetas-stadions" : normalized;
}

/** Select bookings at a venue that overlap the requested Riga days (one day, or every day of a multi-day event). */
export function bookingsForVenueOnDay<T extends { uid: string; location: string | null; start: Date; end: Date }>(
  events: T[], location: string, dayStart: Date, dayEnd: Date, exclude: string | null,
): T[] {
  const venue = normalizeVenue(location);
  // Each day of a multi-day event is "event-<id>@<date>"; all of them belong to the excluded event.
  return events.filter((event) => event.uid.split("@")[0] !== exclude && event.location !== null
    && normalizeVenue(event.location) === venue && event.start < dayEnd && event.end > dayStart);
}
