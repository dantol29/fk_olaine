import { eq } from "drizzle-orm";
import type { createDatabase } from "@olaine/database/client";
import { trainingCoaches, trainingLocations, trainings, trainingTeams } from "@/db/schema";
import type { TrainingInput } from "./training-input";

/** Write one session and all its assignments as a single transaction. */
export async function saveTraining(db: ReturnType<typeof createDatabase>, input: TrainingInput, id?: number) {
  const { teamIds, coachIds, ...fields } = input;
  if (!teamIds.length) throw new Error("A training needs at least one team.");
  return db.transaction(async (tx) => {
    const [row] = id === undefined
      ? await tx.insert(trainings).values({ ...fields, createdAt: Date.now() }).returning({ id: trainings.id })
      : await tx.update(trainings).set(fields).where(eq(trainings.id, id)).returning({ id: trainings.id });
    if (!row) throw new Error("Training not found.");
    await tx.delete(trainingTeams).where(eq(trainingTeams.trainingId, row.id));
    await tx.delete(trainingCoaches).where(eq(trainingCoaches.trainingId, row.id));
    await tx.insert(trainingTeams).values(teamIds.map((teamId) => ({ trainingId: row.id, teamId })));
    if (coachIds.length) {
      await tx.insert(trainingCoaches).values(coachIds.map((coachId) => ({ trainingId: row.id, coachId })));
    }
    await tx.insert(trainingLocations).values({ name: fields.location, createdAt: Date.now() }).onConflictDoNothing();
    return row.id;
  });
}
