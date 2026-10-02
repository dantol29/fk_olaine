import "dotenv/config";

import { db } from "@/db/client";
import { leagueSources } from "@/db/schema";
import { scrapeFixtures } from "@/lib/fixtures";
import { updateFixtureScores } from "@/lib/fixture-scores";

async function main() {
  const sources = await db.select().from(leagueSources);
  let total = 0;
  for (const source of sources) {
    try {
      const fixtures = await scrapeFixtures(source.url);
      const updated = await updateFixtureScores(source.teamId, source.label, fixtures);
      total += updated;
      console.log(`${source.label}: ${updated} game scores updated`);
    } catch (error) {
      console.error(`${source.label}: ${error instanceof Error ? error.message : "Score sync failed"}`);
      process.exitCode = 1;
    }
  }
  console.log(`Total: ${total} existing game scores updated`);
}

void main();
