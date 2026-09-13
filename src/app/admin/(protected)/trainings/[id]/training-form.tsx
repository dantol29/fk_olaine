"use client";

import { useActionState } from "react";

import { createTraining, updateTraining } from "../actions";

type Training = {
  id: number;
  teamId: number;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string | null;
  trainingCoaches: { coachId: number }[];
};
type TeamOption = { id: number; name: string };
type CoachOption = { id: number; name: string };

export function TrainingForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[]; coachOptions: CoachOption[] }
    | { mode: "edit"; training: Training; teamOptions: TeamOption[]; coachOptions: CoachOption[] },
) {
  const action =
    props.mode === "create" ? createTraining : updateTraining.bind(null, props.training.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const training = props.mode === "edit" ? props.training : null;
  const selectedCoachIds = new Set(training?.trainingCoaches.map((tc) => tc.coachId) ?? []);

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauns treniņš" : "Rediģēt treniņu"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Komanda
        <select
          name="teamId"
          required
          defaultValue={training?.teamId ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        >
          <option value="" disabled>
            Izvēlies komandu
          </option>
          {props.teamOptions.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-club-navy">Treneri (nav obligāts)</legend>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {props.coachOptions.map((coach) => (
            <label key={coach.id} className="flex items-center gap-2 text-sm text-club-navy">
              <input
                type="checkbox"
                name="coachIds"
                value={coach.id}
                defaultChecked={selectedCoachIds.has(coach.id)}
              />
              {coach.name}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Datums
        <input
          type="date"
          name="date"
          required
          defaultValue={training?.date ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <div className="mt-4 flex gap-4">
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Sākuma laiks
          <input
            type="time"
            name="startTime"
            required
            defaultValue={training?.startTime ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Beigu laiks
          <input
            type="time"
            name="endTime"
            required
            defaultValue={training?.endTime ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Vieta
        <input
          type="text"
          name="location"
          required
          defaultValue={training?.location ?? "Olaines pilsētas stadions"}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Piezīmes (nav obligāts)
        <textarea
          name="notes"
          rows={3}
          defaultValue={training?.notes ?? ""}
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
