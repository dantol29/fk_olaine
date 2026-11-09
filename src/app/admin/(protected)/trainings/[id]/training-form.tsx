"use client";

import { StadiumAvailability } from "@/components/admin/stadium-availability";

import { useActionState, useState } from "react";

import { createTraining, updateTraining } from "../actions";

type Training = {
  id: number;
  trainingTeams: { teamId: number }[];
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
    | { mode: "create"; teamOptions: TeamOption[]; coachOptions: CoachOption[]; locationOptions: string[] }
    | { mode: "edit"; training: Training; teamOptions: TeamOption[]; coachOptions: CoachOption[]; locationOptions: string[] },
) {
  const action =
    props.mode === "create" ? createTraining : updateTraining.bind(null, props.training.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const training = props.mode === "edit" ? props.training : null;
  const selectedTeamIds = new Set(training?.trainingTeams.map((item) => item.teamId) ?? []);
  const [location, setLocation] = useState(training?.location ?? "Olaines pilsētas stadions");
  const [customLocation, setCustomLocation] = useState("");
  const selectedCoachIds = new Set(training?.trainingCoaches.map((tc) => tc.coachId) ?? []);

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-black">
        {props.mode === "create" ? "Jauns treniņš" : "Rediģēt treniņu"}
      </h1>

      <fieldset>
        <legend className="text-sm font-semibold text-black">Komandas</legend>
        <p className="mt-1 text-sm text-black/55">Izvēlies vienu vai vairākas komandas.</p>
        <div className="mt-2 flex flex-col gap-1.5">
          {props.teamOptions.map((team) => (
            <label key={team.id} className="flex items-center gap-2 text-sm text-black">
              <input type="checkbox" name="teamIds" value={team.id} defaultChecked={selectedTeamIds.has(team.id)} />
              {team.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-black">Treneri (nav obligāts)</legend>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {props.coachOptions.map((coach) => (
            <label key={coach.id} className="flex items-center gap-2 text-sm text-black">
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

      <label className="mt-4 block text-sm font-semibold text-black">
        Datums
        <input
          type="date"
          name="date"
          required
          defaultValue={training?.date ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>

      <div className="mt-4 flex gap-4">
        <label className="flex-1 text-sm font-semibold text-black">
          Sākuma laiks
          <input
            type="time"
            name="startTime"
            required
            defaultValue={training?.startTime ?? ""}
            className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-black">
          Beigu laiks
          <input
            type="time"
            name="endTime"
            required
            defaultValue={training?.endTime ?? ""}
            className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-black">
        Vieta
        <select name="location" value={location} onChange={(event) => setLocation(event.target.value)}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black">
          {props.locationOptions.map((place) => <option key={place} value={place}>{place}</option>)}
          <option value="">Cita vieta…</option>
        </select>
      </label>
      {location === "" && <label className="mt-3 block text-sm font-semibold text-black">
        Vietas nosaukums vai adrese
        <input type="text" name="customLocation" required value={customLocation} onChange={(event) => setCustomLocation(event.target.value)}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black" />
        <span className="mt-1 block text-sm font-normal text-black/55">Pēc saglabāšanas vieta būs pieejama sarakstā.</span>
      </label>}

      <label className="mt-4 block text-sm font-semibold text-black">
        Piezīmes (nav obligāts)
        <textarea
          name="notes"
          rows={3}
          defaultValue={training?.notes ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>

      <StadiumAvailability exclude={training ? `training-${training.id}` : undefined} />

      {state?.error && <p role="alert" className="mt-3 text-sm font-semibold text-club-red">{state.error}</p>}

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
