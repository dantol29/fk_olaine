import "dotenv/config";

import { db } from "@/db/client";
import { leagueSources } from "@/db/schema";
import { syncPlayerPositionsForSource } from "@/lib/player-positions";

async function main() {
  const sources = await db.select().from(leagueSources);
  let total = 0;
  for (const source of sources) {
    try {
      const result = await syncPlayerPositionsForSource(source);
      total += result.updated;
      console.log(`${source.label}: ${result.updated} updated, ${result.matched} matched, ${result.unmatched} unmatched, ${result.conflicts} conflicts`);
    } catch (error) {
      console.error(`${source.label}: ${error instanceof Error ? error.message : "Position sync failed"}`);
      process.exitCode = 1;
    }
  }
  console.log(`Total: ${total} player positions updated`);
}

void main();
