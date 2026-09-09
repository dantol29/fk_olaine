export type ArticleCategory =
  | "Klubs"
  | "Komandas"
  | "Spēles"
  | "Treniņi"
  | "Pasākumi";

export type ArticleQuote = {
  text: string;
  author: string;
  role: string;
};

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: ArticleCategory;
  team?: string;
  image: string;
  body: string[];
  quote?: ArticleQuote;
  highlights?: string[];
  closing?: string;
  signature?: string;
};

/** Formats a "YYYY-MM-DD" date into the Latvian display style used
 *  throughout the jaunumi pages, e.g. "5. sept. 2026". */
export function formatArticleDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12));
  const monthLabel = new Intl.DateTimeFormat("lv-LV", {
    timeZone: "Europe/Riga",
    month: "short",
  }).format(noonUtc);
  return `${day}. ${monthLabel} ${year}`;
}
