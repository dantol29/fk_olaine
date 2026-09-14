import type { Metadata } from "next";

import { GamesDirectory } from "@/components/games-directory";
import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getAllGamesFromDb } from "@/lib/games-server";
import { getLeagueStandingsForDisplay } from "@/lib/league-standings-server";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Spēles",
  description:
    "FK Olaine spēļu grafiks — gaidāmās un aizvadītās spēles visām komandām.",
  alternates: { canonical: "/speles" },
};

export default async function SpelesPage() {
  const [games, leagues] = await Promise.all([
    getAllGamesFromDb(),
    getLeagueStandingsForDisplay(),
  ]);

  const upcomingForSchema = games.filter((game) => !game.isPast).slice(0, 20);
  const gamesJsonLd =
    upcomingForSchema.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: upcomingForSchema.map((game, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "SportsEvent",
              name: `${game.home.name} - ${game.away.name}`,
              startDate: `${game.rawDate}T${game.time}:00`,
              eventStatus: "https://schema.org/EventScheduled",
              eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
              location: { "@type": "Place", name: game.venue },
              competitor: [
                { "@type": "SportsTeam", name: game.home.name },
                { "@type": "SportsTeam", name: game.away.name },
              ],
              organizer: { "@type": "SportsTeam", name: "FK Olaine", url: SITE_URL },
            },
          })),
        }
      : null;

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        {gamesJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(gamesJsonLd) }}
          />
        )}
        <GamesDirectory games={games} leagues={leagues} />
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
