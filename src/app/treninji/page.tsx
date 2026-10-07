import type { Metadata } from "next";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { teams as teamsTable } from "@/db/schema";

import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrainingsDirectory } from "@/components/trainings-directory";
import { getAllTrainingsFromDb } from "@/lib/trainings-server";

export const metadata: Metadata = {
  title: "Treniņi",
  description: "FK Olaine treniņu grafiks visām komandām.",
  alternates: { canonical: "/treninji" },
};

export default async function TreninjiPage() {
  const [trainings, teams] = await Promise.all([
    getAllTrainingsFromDb(),
    db.select({ id: teamsTable.id, name: teamsTable.name }).from(teamsTable).orderBy(desc(teamsTable.isMain), asc(teamsTable.name)),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="bg-[#fafafa]">
        <TrainingsDirectory trainings={trainings} teams={teams} />
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
