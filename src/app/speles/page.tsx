import type { Metadata } from "next";

import { GamesDirectory } from "@/components/games-directory";
import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getAllGamesFromDb } from "@/lib/games-server";
import { getLeagueStandingsForDisplay } from "@/lib/league-standings-server";

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

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <GamesDirectory games={games} leagues={leagues} />
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
