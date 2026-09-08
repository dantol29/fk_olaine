"use client";

import Image from "next/image";
import { useActionState } from "react";

import { createCoach, updateCoach } from "../actions";

type Coach = {
  id: number;
  name: string;
  position: string;
  license: string;
  authority: "UEFA" | "LFF";
  photoUrl: string | null;
  coachTeams: { teamId: number }[];
};
type TeamOption = { id: number; name: string };

export function CoachForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[] }
    | { mode: "edit"; coach: Coach; teamOptions: TeamOption[] },
) {
  const action = props.mode === "create" ? createCoach : updateCoach.bind(null, props.coach.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const coach = props.mode === "edit" ? props.coach : null;
  const selectedTeamIds = new Set(coach?.coachTeams.map((ct) => ct.teamId) ?? []);

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauns treneris" : "Rediģēt treneri"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Vārds, uzvārds
        <input
          type="text"
          name="name"
          required
          defaultValue={coach?.name ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Amats
        <input
          type="text"
          name="position"
          placeholder="Galvenais treneris"
          required
          defaultValue={coach?.position ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Licence
        <input
          type="text"
          name="license"
          placeholder="UEFA A licence"
          required
          defaultValue={coach?.license ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-club-navy">Licences izdevējs</legend>
        <div className="mt-1.5 flex gap-4">
          {(["UEFA", "LFF"] as const).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-club-navy">
              <input
                type="radio"
                name="authority"
                value={option}
                required
                defaultChecked={coach?.authority === option}
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        <span className="block text-sm font-semibold text-club-navy">Foto (nav obligāts)</span>
        {coach?.photoUrl && (
          <Image
            src={coach.photoUrl}
            alt={coach.name}
            width={80}
            height={80}
            className="mt-1.5 h-20 w-20 rounded-lg object-cover"
          />
        )}
        <input
          type="file"
          name="photo"
          accept="image/*"
          className="mt-1.5 block w-full text-sm text-club-navy file:mr-3 file:rounded-lg file:border-0 file:bg-club-gray-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-club-navy hover:file:bg-slate-200"
        />
        {coach?.photoUrl && (
          <label className="mt-2 flex items-center gap-2 text-sm text-club-navy">
            <input type="checkbox" name="removePhoto" />
            Noņemt foto
          </label>
        )}
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-club-navy">Komandas</legend>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {props.teamOptions.map((team) => (
            <label key={team.id} className="flex items-center gap-2 text-sm text-club-navy">
              <input
                type="checkbox"
                name="teamIds"
                value={team.id}
                defaultChecked={selectedTeamIds.has(team.id)}
              />
              {team.name}
            </label>
          ))}
        </div>
      </fieldset>

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
