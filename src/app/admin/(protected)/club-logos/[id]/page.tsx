import { notFound } from "next/navigation";

import { db } from "@/db/client";

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
  const club = await db.query.clubLogos.findFirst({
    where: (clubLogos, { eq }) => eq(clubLogos.id, clubId),
    with: { names: true },
  });
  if (!club) notFound();

  return <ClubLogoForm mode="edit" club={club} />;
}
