import type { Metadata } from "next";
import { db } from "@/db/client";
import { PollDesignComparison } from "@/components/poll-design-comparison";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Aptauju dizaini", robots: { index: false, follow: false } };

export default async function PollDesignsPage() {
  const poll = await db.query.polls.findFirst({ with: { options: true }, orderBy: (polls, { desc }) => [desc(polls.createdAt), desc(polls.id)] });
  return <><SiteHeader />{poll?.options.length ? <PollDesignComparison poll={poll} /> : <main className="px-6 py-16 text-center">Pievieno aptauju administrācijas panelī, lai salīdzinātu dizainus.</main>}</>;
}
