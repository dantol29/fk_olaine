import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { clubPages } from "@/db/schema";
import { ClubPageForm } from "./club-page-form";

export default async function AdminClubPageEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === "new") return <ClubPageForm mode="create" />;
  const pageId = Number(id);
  if (!Number.isSafeInteger(pageId)) notFound();
  const [page] = await db.select().from(clubPages).where(eq(clubPages.id, pageId));
  if (!page) notFound();
  return <ClubPageForm mode="edit" page={page} />;
}
