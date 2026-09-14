import type { Metadata } from "next";
import { Caveat, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

import { getSiteSettings } from "@/lib/site-settings";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "latin-ext"],
});

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
const SITE_DESCRIPTION =
  "FK Olaine futbola kluba oficiālā mājaslapa, dibināts 2008. gadā. Komandas, treneri, spēles un jaunumi.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FK Olaine",
    template: "%s | FK Olaine",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "lv_LV",
    siteName: "FK Olaine",
    title: "FK Olaine",
    description: SITE_DESCRIPTION,
    images: [{ url: "/fk-olaine-crest-v2.png", width: 491, height: 508 }],
  },
  twitter: {
    card: "summary",
    title: "FK Olaine",
    description: SITE_DESCRIPTION,
    images: ["/fk-olaine-crest-v2.png"],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings();

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: "FK Olaine",
    legalName: settings.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/fk-olaine-crest-v2.png`,
    sport: "Soccer",
    foundingDate: "2008",
    email: settings.email,
    telephone: settings.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.stadiumAddress,
      addressLocality: "Olaine",
      addressCountry: "LV",
    },
    sameAs: [
      "https://www.facebook.com/afaolaine.sievietes/",
      "https://www.instagram.com/fkolaine_sievietes/",
    ],
  };

  return (
    <html
      lang="lv"
      className={`${inter.variable} ${geistMono.variable} ${caveat.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
