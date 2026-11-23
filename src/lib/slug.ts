/** Latin letters, digits and hyphens for an address, e.g. "Ķekavas kauss 2026" → "kekavas-kauss-2026". */
export function slugify(value: string): string {
  const withoutDiacritics = value
    .toLowerCase()
    .replace(/[āä]/g, "a")
    .replace(/[čć]/g, "c")
    .replace(/[ēé]/g, "e")
    .replace(/ģ/g, "g")
    .replace(/[īí]/g, "i")
    .replace(/ķ/g, "k")
    .replace(/ļ/g, "l")
    .replace(/ņ/g, "n")
    .replace(/[šś]/g, "s")
    .replace(/[ūü]/g, "u")
    .replace(/[žź]/g, "z");
  return withoutDiacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
