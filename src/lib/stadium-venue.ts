/** Keep aliases explicit: different fields/courts must not collapse together. */
export function normalizeVenue(value: string) {
  const normalized = value.normalize("NFKC").toLocaleLowerCase("lv").replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
  const aliases = ["olaines pilsētas stadions", "olaines stadions", "olaine stadions"];
  return aliases.includes(normalized) ? "olaines-pilsetas-stadions" : normalized;
}

/** Select bookings at a venue that overlap or start on the requested Riga day. */
export function bookingsForVenueOnDay<T extends { uid: string; location: string | null; start: Date; end: Date }>(
  events: T[], location: string, dayStart: Date, dayEnd: Date, exclude: string | null,
): T[] {
  const venue = normalizeVenue(location);
  return events.filter((event) => event.uid !== exclude && event.location !== null
    && normalizeVenue(event.location) === venue && event.start < dayEnd && event.end > dayStart);
}
