import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { events, teams } from "@/db/schema";

import { EventForm } from "./event-form";

export default async function AdminEventFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = await db.select().from(teams).orderBy(teams.name);

  if (id === "new") {
    return <EventForm mode="create" teamOptions={teamOptions} />;
  }

  const eventId = Number(id);
  const [event] = await db.select().from(events).where(eq(events.id, eventId));
  if (!event) notFound();

  return <EventForm mode="edit" event={event} teamOptions={teamOptions} />;
}
