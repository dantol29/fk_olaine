"use client";

import { useActionState } from "react";

import { createTeam, updateTeam } from "../actions";

type Team = { id: number; name: string; isMain: boolean };

export function TeamForm(props: { mode: "create" } | { mode: "edit"; team: Team }) {
  const action = props.mode === "create" ? createTeam : updateTeam.bind(null, props.team.id);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-black">
        {props.mode === "create" ? "Jauna komanda" : "Rediģēt komandu"}
      </h1>

      <label className="block text-sm font-semibold text-black">
        Nosaukums
        <input
          type="text"
          name="name"
          required
          defaultValue={props.mode === "edit" ? props.team.name : ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>

      <label className="mt-6 flex items-start gap-3 text-sm">
        <input type="checkbox" name="isMain" defaultChecked={props.mode === "edit" && props.team.isMain} className="mt-0.5 size-4 shrink-0 accent-black" />
        <span><span className="block font-semibold">Galvenā komanda</span><span className="mt-1 block text-black/55">Rādīt sākumlapas komandas galerijā. Izvēloties šo komandu, iepriekšējā galvenā komanda tiks nomainīta.</span></span>
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
