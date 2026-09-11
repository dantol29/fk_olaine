import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { partners } from "@/db/schema";

import { PartnerForm } from "./partner-form";

export default async function AdminPartnerFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") {
    return <PartnerForm mode="create" />;
  }

  const partnerId = Number(id);
  const [partner] = await db.select().from(partners).where(eq(partners.id, partnerId));
  if (!partner) notFound();

  return <PartnerForm mode="edit" partner={partner} />;
}
