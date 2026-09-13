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
        "h-full rounded-2xl bg-white pt-6 pr-4 pb-4 pl-6 sm:pt-8 sm:pr-5 sm:pb-5 sm:pl-8",
        className,
      )}
    >
      <h3 className="text-3xl tracking-[-0.02em] text-club-navy sm:text-4xl">Treneri</h3>

      <div className="mt-4">
        <CoachesListView coaches={coaches} />
      </div>
    </div>
  );
}
