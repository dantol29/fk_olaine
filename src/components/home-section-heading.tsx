import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HomeSectionHeading({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return <div className="mb-7 flex flex-wrap items-center justify-between gap-4 sm:mb-9">
    <h2 className="text-3xl leading-tight font-semibold text-black uppercase sm:text-4xl lg:text-5xl">{title}</h2>
    {href && <Link href={href} className="flex min-h-11 items-center gap-3 border-2 border-black px-4 text-xs font-semibold text-black uppercase hover:bg-black hover:text-white focus-visible:outline-black">{linkLabel}<ArrowRight className="size-4" aria-hidden="true" /></Link>}
  </div>;
}
