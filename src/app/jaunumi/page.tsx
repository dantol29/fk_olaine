import { JaunumiDirectory } from "@/components/jaunumi-directory";
import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function JaunumiPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <JaunumiDirectory />
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
