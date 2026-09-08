"use client";

import { useActionState } from "react";

import { createGame, updateGame } from "../actions";

type Game = {
  id: number;
  teamId: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  league: string | null;
  notes: string | null;
};
type TeamOption = { id: number; name: string };

export function GameForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[] }
    | { mode: "edit"; game: Game; teamOptions: TeamOption[] },
) {
  const action = props.mode === "create" ? createGame : updateGame.bind(null, props.game.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const game = props.mode === "edit" ? props.game : null;

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauna spēle" : "Rediģēt spēli"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Komanda
        <select
          name="teamId"
          required
          defaultValue={game?.teamId ?? ""}
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

      <div className="mt-4 flex gap-4">
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Mājinieki
          <input
            type="text"
            name="homeTeam"
            required
            placeholder="FK Olaine"
            defaultValue={game?.homeTeam ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Viesi
          <input
            type="text"
            name="awayTeam"
            required
            placeholder="FK Ventspils"
            defaultValue={game?.awayTeam ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Datums
        <input
          type="date"
          name="date"
          required
          defaultValue={game?.date ?? ""}
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
            defaultValue={game?.startTime ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Beigu laiks
          <input
            type="time"
            name="endTime"
            required
            defaultValue={game?.endTime ?? ""}
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
          defaultValue={game?.location ?? "Olaines pilsētas stadions"}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Sacensības (nav obligāts)
        <input
          type="text"
          name="league"
          placeholder="Draudzības spēle"
          defaultValue={game?.league ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Piezīmes (nav obligāts)
        <textarea
          name="notes"
          rows={3}
          defaultValue={game?.notes ?? ""}
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
