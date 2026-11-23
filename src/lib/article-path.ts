// A news article's address is /jaunumi/<its slug>-<id>. The id at the end makes every address unique, whatever the
// title. Older addresses were /jaunumi/<slug>; they still open the article and move to the current address.

/** The last part of the article's address. */
export function articleAddress(article: { slug: string; id: number }): string {
  return `${article.slug}-${article.id}`;
}

export function articlePath(article: { slug: string; id: number }): string {
  return `/jaunumi/${encodeURIComponent(articleAddress(article))}`;
}

/** The article id at the end of an address, or null. An old address may also end in a number (a year, or a "-2"
 *  that kept two slugs apart), so the caller still checks that the whole address matches. */
export function articleIdFromAddress(address: string): number | null {
  const match = /-(\d+)$/.exec(address);
  const id = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
