import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { clubLogos } from "@/db/schema";

import { ClubLogoForm } from "./club-logo-form";

export default async function AdminClubLogoFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") {
    return <ClubLogoForm mode="create" />;
  }

  const clubId = Number(id);
  const [club] = await db.select().from(clubLogos).where(eq(clubLogos.id, clubId));
  if (!club) notFound();

  return <ClubLogoForm mode="edit" club={club} />;
}
