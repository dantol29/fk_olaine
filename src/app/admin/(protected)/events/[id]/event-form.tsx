"use client";

import { useActionState } from "react";

import { createEvent, updateEvent } from "../actions";

type Event = {
  id: number;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  notes: string | null;
  teamId: number | null;
};
type TeamOption = { id: number; name: string };

export function EventForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[] }
    | { mode: "edit"; event: Event; teamOptions: TeamOption[] },
) {
  const action = props.mode === "create" ? createEvent : updateEvent.bind(null, props.event.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const event = props.mode === "edit" ? props.event : null;

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauns notikums" : "Rediģēt notikumu"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Nosaukums
        <input
          type="text"
          name="title"
          required
          defaultValue={event?.title ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Datums
        <input
          type="date"
          name="date"
          required
          defaultValue={event?.date ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <div className="mt-4 flex gap-4">
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Sākuma laiks (nav obligāts — tukšs nozīmē &quot;visu dienu&quot;)
          <input
            type="time"
            name="startTime"
            defaultValue={event?.startTime ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Beigu laiks (nav obligāts)
          <input
            type="time"
            name="endTime"
            defaultValue={event?.endTime ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Vieta (nav obligāta)
        <input
          type="text"
          name="location"
          defaultValue={event?.location ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Komanda (nav obligāta — atstāj tukšu visam klubam)
        <select
          name="teamId"
          defaultValue={event?.teamId ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        >
          <option value="">Viss klubs</option>
          {props.teamOptions.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Piezīmes (nav obligāts)
        <textarea
          name="notes"
          rows={3}
          defaultValue={event?.notes ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      {state?.error && <p className="mt-3 text-sm font-semibold text-club-red">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50"
      >
        {pending ? "Saglabā..." : "Saglabāt"}
      </button>
    </form>
  );
}
