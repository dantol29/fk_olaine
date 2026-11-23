"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { StadiumAvailability } from "@/components/admin/stadium-availability";

import { createEvent, updateEvent } from "../actions";

type Event = {
  id: number;
  title: string;
  date: string;
  /** Last day of a multi-day event; null for one day. */
  endDate: string | null;
  startTime: string;
  endTime: string;
  location: string;
  notes: string | null;
  description: string | null;
  image: string | null;
  /** Gallery photo URLs, one per line. */
  gallery: string | null;
  /** Empty when the event belongs to no team. */
  teamIds: number[];
};
type TeamOption = { id: number; name: string };

const FIELD_CLASS = "mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black";
const FILE_CLASS = "mt-1.5 block w-full text-sm text-black file:mr-3 file:rounded-none file:border-0 file:bg-black/5 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-black/10";

export function EventForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[] }
    | { mode: "edit"; event: Event; teamOptions: TeamOption[] },
) {
  const action = props.mode === "create" ? createEvent : updateEvent.bind(null, props.event.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const event = props.mode === "edit" ? props.event : null;
  const [date, setDate] = useState(event?.date ?? "");
  const [isMultiDay, setIsMultiDay] = useState(Boolean(event?.endDate));
  const selectedTeamIds = new Set(event?.teamIds ?? []);
  const galleryUrls = event?.gallery?.split("\n").filter(Boolean) ?? [];

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-black">
        {props.mode === "create" ? "Jauns notikums" : "Rediģēt notikumu"}
      </h1>

      <label className="block text-sm font-semibold text-black">
        Nosaukums
        <input type="text" name="title" required defaultValue={event?.title ?? ""} className={FIELD_CLASS} />
      </label>

      <label className="mt-4 block text-sm font-semibold text-black">
        Datums
        <input type="date" name="date" required value={date} onChange={(change) => setDate(change.target.value)} className={FIELD_CLASS} />
      </label>

      <label className="mt-2 flex items-center gap-2 text-sm text-black">
        <input type="checkbox" checked={isMultiDay} onChange={(change) => setIsMultiDay(change.target.checked)} />
        Vairākas dienas
      </label>
      {isMultiDay && (
        <label className="mt-2 block text-sm font-semibold text-black">
          Beigu datums
          <input type="date" name="endDate" required min={date || undefined} defaultValue={event?.endDate ?? ""} className={FIELD_CLASS} />
          <span className="mt-1 block text-xs font-normal text-black/45">Sākuma laiks ir pirmajā dienā, beigu laiks — pēdējā.</span>
        </label>
      )}

      <div className="mt-4 flex gap-4">
        <label className="flex-1 text-sm font-semibold text-black">
          Sākuma laiks
          <input type="time" name="startTime" required defaultValue={event?.startTime ?? ""} className={FIELD_CLASS} />
        </label>
        <label className="flex-1 text-sm font-semibold text-black">
          Beigu laiks
          <input type="time" name="endTime" required defaultValue={event?.endTime ?? ""} className={FIELD_CLASS} />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-black">
        Vieta
        <input type="text" name="location" required defaultValue={event?.location ?? ""} className={FIELD_CLASS} />
      </label>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-black">Komandas</legend>
        <p className="text-xs text-black/45">Nav obligātas. Notikums bez komandām netiek rādīts komandu filtrā kalendārā; kopīgam kluba notikumam atzīmē visas.</p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5">
          {props.teamOptions.map((team) => (
            <label key={team.id} className="flex items-center gap-2 text-sm text-black">
              <input type="checkbox" name="teamIds" value={team.id} defaultChecked={selectedTeamIds.has(team.id)} />
              {team.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 text-sm font-semibold text-black">
        Apraksts (nav obligāts)
        <RichTextEditor name="description" defaultValue={event?.description ?? ""} />
        <span className="mt-1 block text-xs font-normal text-black/45">Redzams notikuma lapā.</span>
      </div>

      <div className="mt-4">
        <span className="block text-sm font-semibold text-black">Galvenais attēls (nav obligāts)</span>
        {event?.image && <Image src={event.image} alt="" width={120} height={80} className="mt-1.5 h-20 w-32 rounded-none object-cover" />}
        <input type="file" name="image" accept="image/*" className={FILE_CLASS} />
        {event?.image && (
          <label className="mt-2 flex items-center gap-2 text-sm text-black">
            <input type="checkbox" name="removeImage" />
            Noņemt attēlu
          </label>
        )}
      </div>

      <div className="mt-4">
        <span className="block text-sm font-semibold text-black">Galerija (nav obligāta)</span>
        {galleryUrls.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {galleryUrls.map((url) => <Image key={url} src={url} alt="" width={60} height={60} className="h-14 w-14 rounded-none object-cover" />)}
          </div>
        )}
        <input type="file" name="gallery" accept="image/*" multiple className={FILE_CLASS} />
        <p className="mt-1 text-xs text-black/45">Jaunu attēlu augšupielāde aizstās esošos.</p>
        {galleryUrls.length > 0 && (
          <label className="mt-2 flex items-center gap-2 text-sm text-black">
            <input type="checkbox" name="removeGallery" />
            Noņemt esošos attēlus
          </label>
        )}
      </div>

      <label className="mt-4 block text-sm font-semibold text-black">
        Piezīmes (nav obligāts, redz tikai administrācija)
        <textarea name="notes" rows={3} defaultValue={event?.notes ?? ""} className={FIELD_CLASS} />
      </label>

      <StadiumAvailability exclude={event ? `event-${event.id}` : undefined} />

      {state?.error && <p className="mt-3 text-sm font-semibold text-club-red">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-none bg-club-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50"
      >
        {pending ? "Saglabā..." : "Saglabāt"}
      </button>
    </form>
  );
}
