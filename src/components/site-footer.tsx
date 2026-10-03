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
        <div aria-hidden="true" className="h-20 bg-[#e8e8e8] sm:h-24" />
        <section id="partners" aria-labelledby="partners-heading" className="scroll-mt-24 bg-white px-6 pt-6 pb-12 text-black sm:px-12 sm:pb-14">
          <h2 id="partners-heading" className="text-center text-lg font-semibold uppercase sm:text-xl">Kluba partneri</h2>
          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 items-center justify-center gap-x-6 gap-y-8 sm:mt-14 sm:flex sm:flex-wrap sm:gap-x-14">
            {partners.map((partner) => {
              const image = (
                <Image src={partner.logoUrl} alt={partner.name} width={partner.logoWidth} height={partner.logoHeight} className="max-h-14 w-auto max-w-full object-contain grayscale opacity-60 transition-[filter,opacity] duration-200 group-hover:grayscale-0 group-hover:opacity-100 group-focus-visible:grayscale-0 group-focus-visible:opacity-100 motion-reduce:transition-none sm:max-w-[160px]" />
              );
              return partner.websiteUrl ? (
                <a key={partner.id} href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="group flex min-h-16 items-center justify-center focus-visible:outline-black">{image}</a>
              ) : <span key={partner.id} className="group flex min-h-16 items-center justify-center">{image}</span>;
            })}
          </div>
        </section>
        </>
      )}
    <footer id="footer" className="scroll-mt-24 bg-black text-white">
      <div className="mx-auto max-w-[1600px] px-6 pt-12 pb-6 sm:px-12 lg:px-20">
        <Link href="/" aria-label="FK Olaine — sākums" className="mx-auto flex w-fit flex-col items-center focus-visible:outline-white">
          <Image src="/fk-olaine-crest-v2.png" alt="" width={124} height={128} className="h-20 w-auto object-contain" />
          <span className="mt-2 text-2xl leading-none font-semibold tracking-tight uppercase">FK Olaine</span>
          <span className="mt-1 text-xs leading-none font-semibold uppercase">Kopš 2008</span>
        </Link>

        <div className="mt-8 flex flex-col items-center justify-between gap-x-8 gap-y-4 sm:mt-7 lg:flex-row lg:items-start">
          <div aria-label="Sociālie tīkli" className="flex shrink-0 items-center gap-1">
            <a href="https://www.facebook.com/afaolaine.sievietes/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex size-11 items-center justify-center hover:text-white/70 focus-visible:outline-white">
              <FacebookIcon className="size-7" />
            </a>
            <a href="https://www.instagram.com/fkolaine_sievietes/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex size-11 items-center justify-center hover:text-white/70 focus-visible:outline-white">
              <InstagramIcon className="size-7" />
            </a>
            <a href="https://www.youtube.com/c/avanakeks/videos" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="flex size-11 items-center justify-center hover:text-white/70 focus-visible:outline-white">
              <YouTubeIcon className="size-7" aria-hidden="true" />
            </a>
          </div>

          <nav aria-label="Kājenes navigācija" className="flex flex-col items-center justify-center gap-x-6 gap-y-0 sm:flex-row sm:flex-wrap sm:gap-y-2 lg:justify-end lg:gap-x-9">
            {navItems.map((item) => <Link key={item.href} href={item.href} className={navLinkClass}>{item.title}</Link>)}
          </nav>
        </div>
      </div>
    </footer>
    </>
  );
}
