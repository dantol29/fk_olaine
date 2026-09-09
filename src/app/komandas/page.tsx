import type { Metadata } from "next";

import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TeamsDirectory } from "@/components/teams-directory";
import { db } from "@/db/client";

export const metadata: Metadata = {
  title: "Komandas",
  description:
    "FK Olaine komandas — no akadēmijas līdz pirmajai komandai. Iepazīsties ar spēlētājiem visās vecuma grupās.",
  alternates: { canonical: "/komandas" },
};

export default async function KomandasPage() {
  const rows = await db.query.teams.findMany({
    with: { playerTeams: { with: { player: true } } },
    orderBy: (teams, { asc }) => [asc(teams.name)],
  });

  const teams = rows.map((team) => ({
    name: team.name,
    players: team.playerTeams
      .map((pt) => pt.player)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "lv"))
      .map((player) => ({
        name: player.name,
        birthdate: player.birthdate,
        photo: player.photoUrl ?? undefined,
      })),
  }));

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <TeamsDirectory teams={teams} />
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
