import type { Metadata } from "next";

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
  const trainings = await getAllTrainingsFromDb();

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <TrainingsDirectory trainings={trainings} />
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
