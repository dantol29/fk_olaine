"use client";

import Image from "next/image";
import { useActionState } from "react";

import { createPlayer, updatePlayer } from "../actions";
import { NATIONALITIES } from "@/lib/nationality";

type Player = {
  id: number;
  name: string;
  birthdate: string;
  photoUrl: string | null;
  number: number | null;
  position: string | null;
  nationality: string;
  playerTeams: { teamId: number; goals: number }[];
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
  const selectedTeamIds = new Set(player?.playerTeams.map((pt) => pt.teamId) ?? []);

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-black">
        {props.mode === "create" ? "Jauns spēlētājs" : "Rediģēt spēlētāju"}
      </h1>

      <label className="block text-sm font-semibold text-black">
        Vārds, uzvārds
        <input
          type="text"
          name="name"
          required
          defaultValue={player?.name ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-black">
        Dzimšanas datums (DD.MM.GGGG.)
        <input
          type="text"
          name="birthdate"
          placeholder="12.04.1998."
          required
          defaultValue={player?.birthdate ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-black">
        Numurs (nav obligāts)
        <input
          type="number"
          name="number"
          min={0}
          step={1}
          defaultValue={player?.number ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-black">
        Pozīcija
        <select name="position" defaultValue={player?.position ?? "defender"} className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm">
          <option value="goalkeeper">Vārtsargs</option>
          <option value="defender">Aizsargs</option>
          <option value="midfielder">Pussargs</option>
          <option value="forward">Uzbrucējs</option>
        </select>
      </label>

      <label className="mt-4 block text-sm font-semibold text-black">
        Pilsonība
        <select name="nationality" defaultValue={player?.nationality ?? "LV"} className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm">
          {NATIONALITIES.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
        </select>
      </label>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-black">Komandas un gūtie vārti</legend>
        <p className="mt-1 text-xs text-black/45">
          Gūtie vārti tiek uzskaitīti atsevišķi katrai komandai/līgai — spēlētājs, kurš spēlē
          vairākās komandās, var tajās būt guvis atšķirīgu vārtu skaitu.
        </p>
        <div className="mt-1.5 flex flex-col gap-2">
          {props.teamOptions.map((team) => {
            const existingGoals = player?.playerTeams.find((pt) => pt.teamId === team.id)?.goals ?? 0;
            return (
              <div key={team.id} className="flex items-center gap-3">
                <label className="flex flex-1 items-center gap-2 text-sm text-black">
                  <input
                    type="checkbox"
                    name="teamIds"
                    value={team.id}
                    defaultChecked={selectedTeamIds.has(team.id)}
                  />
                  {team.name}
                </label>
                <input
                  type="number"
                  name={`goals-${team.id}`}
                  min={0}
                  step={1}
                  placeholder="Vārti"
                  defaultValue={existingGoals}
                  className="w-20 rounded-none border border-black/15 px-2 py-1 text-sm text-black outline-none focus:border-black"
                />
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4">
        <span className="block text-sm font-semibold text-black">Foto (nav obligāts)</span>
        {player?.photoUrl && (
          <Image
            src={player.photoUrl}
            alt={player.name}
            width={80}
            height={80}
            className="mt-1.5 h-20 w-20 rounded-none object-cover"
          />
        )}
        <input
          type="file"
          name="photo"
          accept="image/*"
          className="mt-1.5 block w-full text-sm text-black file:mr-3 file:rounded-none file:border-0 file:bg-[#f5f5f5] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-black/15"
        />
        {player?.photoUrl && (
          <label className="mt-2 flex items-center gap-2 text-sm text-black">
            <input type="checkbox" name="removePhoto" />
            Noņemt foto
          </label>
        )}
      </div>

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
