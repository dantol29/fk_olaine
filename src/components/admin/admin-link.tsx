import Link from "next/link";
import type { ComponentProps } from "react";

/** A link inside the admin that never prefetches its target.
 *  Next.js prefetches every visible link and repeats it after each save, because a save clears the prefetched
 *  pages. The admin shows dozens of links (menu, lists), so one save sent ~40 requests within a second, and the
 *  host's flood protection then refused every request from that address for about 30 seconds — Apache answers
 *  403, and its error page /403.shtml is passed to the site, which shows it as 404. Admin pages always read fresh
 *  data, so prefetching gains little here. */
export function AdminLink(props: Omit<ComponentProps<typeof Link>, "prefetch">) {
  return <Link {...props} prefetch={false} />;
}
