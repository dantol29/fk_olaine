"use client";

import { useActionState } from "react";

import { createGame, updateGame } from "../actions";

type Game = {
  id: number;
  teamId: number;
  opponent: string;
  date: string;
  time: string | null;
  homeAway: "home" | "away";
  location: string | null;
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
      <p className="mb-4 text-sm text-slate-500">
        Tikai neliga spēles (draudzības, kausa spēles). Oficiālās līgas spēles nāk no lff.lv.
      </p>

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

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Pretinieks
        <input
          type="text"
          name="opponent"
          required
          defaultValue={game?.opponent ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <div className="mt-4 flex gap-4">
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Datums
          <input
            type="date"
            name="date"
            required
            defaultValue={game?.date ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Laiks (nav obligāts)
          <input
            type="time"
            name="time"
            defaultValue={game?.time ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-club-navy">Māja / izbraukums</legend>
        <div className="mt-1.5 flex gap-4">
          {(
            [
              { value: "home", label: "Mājās" },
              { value: "away", label: "Izbraukumā" },
            ] as const
          ).map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-club-navy">
              <input
                type="radio"
                name="homeAway"
                value={option.value}
                required
                defaultChecked={game?.homeAway === option.value}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Vieta (nav obligāta)
        <input
          type="text"
          name="location"
          defaultValue={game?.location ?? ""}
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
