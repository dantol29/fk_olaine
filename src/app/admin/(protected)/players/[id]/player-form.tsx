"use client";

import { useActionState } from "react";

import { createPlayer, updatePlayer } from "../actions";

type Player = {
  id: number;
  name: string;
  birthdate: string;
  teamId: number;
  photoUrl: string | null;
};
type TeamOption = { id: number; name: string };

export function PlayerForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[] }
    | { mode: "edit"; player: Player; teamOptions: TeamOption[] },
) {
  const action = props.mode === "create" ? createPlayer : updatePlayer.bind(null, props.player.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const player = props.mode === "edit" ? props.player : null;

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauns spēlētājs" : "Rediģēt spēlētāju"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Vārds, uzvārds
        <input
          type="text"
          name="name"
          required
          defaultValue={player?.name ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Dzimšanas datums (DD.MM.GGGG.)
        <input
          type="text"
          name="birthdate"
          placeholder="12.04.1998."
          required
          defaultValue={player?.birthdate ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Komanda
        <select
          name="teamId"
          required
          defaultValue={player?.teamId ?? ""}
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

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Foto URL (nav obligāts)
        <input
          type="text"
          name="photoUrl"
          placeholder="/coach-portrait.png"
          defaultValue={player?.photoUrl ?? ""}
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
