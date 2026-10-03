import { cn } from "@/lib/utils";
import { db } from "@/db/client";
import { CoachesListView } from "@/components/coaches-list-view";

async function getCoaches() {
  const rows = await db.query.coaches.findMany({
    orderBy: (coaches, { asc }) => [asc(coaches.name)],
  });

  return rows.map((coach) => ({
    id: coach.id,
    name: coach.name,
    position: coach.position,
    photoUrl: coach.photoUrl,
    license: coach.license,
    authority: coach.authority,
  }));
}

/** Compact "Treneri" list — styled to match top-scorers-list.tsx /
 *  upcoming-birthdays.tsx exactly (same card shell, divide-y rows), since
 *  all three sit flush side by side on the homepage under the Komandas
 *  panel. */
export async function CoachesList({ className }: { className?: string } = {}) {
  const coaches = await getCoaches();
  if (coaches.length === 0) return null;

  return (
    <div
      className={cn(
        "h-full border border-black/15 bg-white p-5 sm:p-6",
        className,
      )}
    >
      <h3 className="text-2xl font-semibold text-black uppercase">Treneri</h3>

      <div className="mt-4">
        <CoachesListView coaches={coaches} />
      </div>
    </div>
  );
}
