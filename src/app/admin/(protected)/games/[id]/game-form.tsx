"use client";

import { useActionState, useState } from "react";

import { createGame, updateGame } from "../actions";

type Game = {
  id: number;
  teamId: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  league: string | null;
  leagueSourceId: number | null;
  notes: string | null;
};
type LeagueOption = { id: number; teamId: number; label: string };
type TeamOption = { id: number; name: string };

export function GameForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[]; leagueOptions: LeagueOption[] }
    | { mode: "edit"; game: Game; teamOptions: TeamOption[]; leagueOptions: LeagueOption[] },
) {
  const action = props.mode === "create" ? createGame : updateGame.bind(null, props.game.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const game = props.mode === "edit" ? props.game : null;

  const [teamId, setTeamId] = useState(game?.teamId ?? 0);

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-black">
        {props.mode === "create" ? "Jauna spēle" : "Rediģēt spēli"}
      </h1>

      <label className="block text-sm font-semibold text-black">
        Komanda
        <select
          name="teamId"
          required
          value={teamId || ""}
          onChange={(event) => setTeamId(Number(event.target.value))}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
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
        <label className="flex-1 text-sm font-semibold text-black">
          Mājinieki
          <input
            type="text"
            name="homeTeam"
            required
            placeholder="FK Olaine"
            defaultValue={game?.homeTeam ?? ""}
            className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-black">
          Viesi
          <input
            type="text"
            name="awayTeam"
            required
            placeholder="FK Ventspils"
            defaultValue={game?.awayTeam ?? ""}
            className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
          />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-black">Rezultāts (nav obligāts)</legend>
        <div className="mt-2 flex gap-4">
          <label className="flex-1 text-sm text-black">Mājinieki<input type="number" name="homeScore" min={0} step={1} defaultValue={game?.homeScore ?? ""} className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2" /></label>
          <label className="flex-1 text-sm text-black">Viesi<input type="number" name="awayScore" min={0} step={1} defaultValue={game?.awayScore ?? ""} className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2" /></label>
        </div>
      </fieldset>

      <label className="mt-4 block text-sm font-semibold text-black">
        Datums
        <input
          type="date"
          name="date"
          required
          defaultValue={game?.date ?? ""}
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
            defaultValue={game?.startTime ?? ""}
            className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-black">
          Beigu laiks
          <input
            type="time"
            name="endTime"
            required
            defaultValue={game?.endTime ?? ""}
            className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-black">
        Vieta
        <input
          type="text"
          name="location"
          required
          defaultValue={game?.location ?? "Olaines pilsētas stadions"}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-black">
        Līgas avots (nav obligāts)
        <select key={teamId} name="leagueSourceId" defaultValue={game && teamId === game.teamId ? game.leagueSourceId ?? "" : ""} className="mt-1.5 w-full border border-black/15 px-3 py-2 text-sm">
          <option value="">Bez līgas avota</option>
          {props.leagueOptions.filter((source) => source.teamId === teamId).map((source) => <option key={source.id} value={source.id}>{source.label}</option>)}
        </select>
      </label>

      <label className="mt-4 block text-sm font-semibold text-black">
        Sacensības (nav obligāts)
        <input
          type="text"
          name="league"
          placeholder="Draudzības spēle"
          defaultValue={game?.league ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-black">
        Piezīmes (nav obligāts)
        <textarea
          name="notes"
          rows={3}
          defaultValue={game?.notes ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>

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
