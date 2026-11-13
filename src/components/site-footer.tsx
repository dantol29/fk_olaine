import Image from "next/image";
import Link from "next/link";

import { FacebookIcon, InstagramIcon, YouTubeIcon } from "@/components/social-icons";
import { getPartners } from "@/lib/partners-server";
import { getPublishedClubPages } from "@/lib/club-pages-server";

const navLinkClass = "flex min-h-8 items-center text-sm hover:text-white/70 focus-visible:outline-white sm:min-h-11";

export async function SiteFooter() {
  const [clubPages, partners] = await Promise.all([getPublishedClubPages(), getPartners()]);
  const navItems = [
    { title: "Jaunumi", href: "/jaunumi" },
    { title: "Spēles", href: "/speles" },
    { title: "Komandas", href: "/komandas" },
    ...clubPages.map((page) => ({ title: page.title, href: `/klubs/${page.slug}` })),
    { title: "Treniņi", href: "/treninji" },
    { title: "Kalendārs", href: "/kalendars" },
    { title: "Kontakti", href: "/kontakti" },
  ];

  return (
    <>
      {partners.length > 0 && (
        <>
        <section id="partners" aria-labelledby="partners-heading" className="scroll-mt-24 bg-club-navy px-6 pt-12 pb-12 text-white sm:px-12 sm:pt-16 sm:pb-16">
          <div className="mx-auto max-w-[1280px] 2xl:max-w-[1600px]">
          <h2 id="partners-heading" className="text-2xl font-semibold uppercase text-white sm:text-3xl">Kluba partneri</h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:mt-8 sm:gap-8">
            {partners.map((partner) => {
              const image = (
                <Image src={partner.logoUrl} alt={partner.name} width={partner.logoWidth} height={partner.logoHeight} className="max-h-14 w-auto max-w-full object-contain transition-opacity duration-200 group-hover:opacity-75 motion-reduce:transition-none sm:max-w-[160px]" />
              );
              return partner.websiteUrl ? (
                <a key={partner.id} href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="group flex min-h-20 w-[calc(50%-0.5rem)] items-center justify-center px-4 py-3 focus-visible:outline-white sm:w-44">{image}</a>
              ) : <span key={partner.id} className="group flex min-h-20 w-[calc(50%-0.5rem)] items-center justify-center px-4 py-3 sm:w-44">{image}</span>;
            })}
          </div>
          </div>
        </section>
        </>
      )}
    <footer id="footer" className="scroll-mt-24 bg-club-navy-light text-white">
      <div className="mx-auto max-w-[1392px] px-6 py-10 sm:px-10 sm:py-14 lg:px-14 2xl:max-w-[1712px]">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="shrink-0">
          <Link href="/" className="inline-flex items-center gap-3 focus-visible:outline-white">
            <Image src="/fk-olaine-crest-v2.png" alt="" width={56} height={58} className="h-14 w-auto" />
            <span className="text-xl font-semibold">FK OLAINE</span>
          </Link>
          <div aria-label="Sociālie tīkli" className="mt-5 flex items-center gap-2">
            <a href="https://www.facebook.com/afaolaine.sievietes/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="motion-icon flex size-11 items-center justify-center hover:text-white/70 focus-visible:outline-white">
              <FacebookIcon className="size-7" />
            </a>
            <a href="https://www.instagram.com/fkolaine_sievietes/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="motion-icon flex size-11 items-center justify-center hover:text-white/70 focus-visible:outline-white">
              <InstagramIcon className="size-7" />
            </a>
            <a href="https://www.youtube.com/c/avanakeks/videos" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="motion-icon flex size-11 items-center justify-center hover:text-white/70 focus-visible:outline-white">
              <YouTubeIcon className="size-7" aria-hidden="true" />
            </a>
          </div>
          </div>

          <nav aria-label="Kājenes navigācija" className="flex flex-wrap gap-x-6 gap-y-1 lg:max-w-3xl lg:justify-end lg:gap-x-9">
            {navItems.map((item) => <Link key={item.href} href={item.href} className={navLinkClass}>{item.title}</Link>)}
          </nav>
        </div>
        <p className="mt-8 border-t border-white/15 pt-5 text-xs text-white/55 lg:text-right">
          Izstrāde:{" "}
          <a href="https://42days.eu/lv" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline focus-visible:outline-white">42days</a>
        </p>
      </div>
    </footer>
    </>
  );
}
