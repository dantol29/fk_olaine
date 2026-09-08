import { CoachesDirectory } from "@/components/coaches-directory";
import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db/client";

export default async function TreneriPage() {
  const rows = await db.query.coaches.findMany({
    with: { coachTeams: { with: { team: true } } },
    orderBy: (coaches, { asc }) => [asc(coaches.name)],
  });

  const coaches = rows.map((coach) => ({
    name: coach.name,
    position: coach.position,
    license: coach.license,
    authority: coach.authority,
    teams: coach.coachTeams.map((ct) => ct.team.name),
    photo: coach.photoUrl ?? undefined,
  }));

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <CoachesDirectory coaches={coaches} />
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
