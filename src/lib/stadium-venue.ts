/** Keep aliases explicit: different fields/courts must not collapse together. */
export function normalizeVenue(value: string) {
  const normalized = value.normalize("NFKC").toLocaleLowerCase("lv").replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
  const aliases = ["olaines pilsētas stadions", "olaines stadions", "olaine stadions"];
  return aliases.includes(normalized) ? "olaines-pilsetas-stadions" : normalized;
}
