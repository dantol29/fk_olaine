"use client";

import Image from "next/image";
import { useActionState } from "react";

import { createClubLogo, updateClubLogo } from "../actions";

type ClubLogo = { id: number; logoUrl: string; names: { name: string }[] };

export function ClubLogoForm(props: { mode: "create" } | { mode: "edit"; club: ClubLogo }) {
  const action =
    props.mode === "create" ? createClubLogo : updateClubLogo.bind(null, props.club.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const club = props.mode === "edit" ? props.club : null;

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-black">
        {props.mode === "create" ? "Jauns kluba logo" : "Rediģēt kluba logo"}
      </h1>

      <label className="block text-sm font-semibold text-black">
        Nosaukumi (katrs savā rindā)
        <textarea
          name="names"
          required
          rows={4}
          placeholder={"FK Ventspils\nFK Ventspils/DFS"}
          defaultValue={club?.names.map((n) => n.name).join("\n") ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>
      <p className="mt-1.5 text-xs text-black/45">
        Katram nosaukumam precīzi jāsakrīt ar to, kāds redzams spēlēs (Mājinieki / Viesi).
        Pievieno vairākus, ja tas pats klubs parādās ar atšķirīgu rakstību.
      </p>

      <div className="mt-4">
        <span className="block text-sm font-semibold text-black">Logotips</span>
        {club?.logoUrl && (
          <Image
            src={club.logoUrl}
            alt={club.names[0]?.name ?? ""}
            width={80}
            height={80}
            className="mt-1.5 h-20 w-20 rounded-none object-contain"
          />
        )}
        <input
          type="file"
          name="photo"
          accept="image/*"
          required={props.mode === "create"}
          className="mt-1.5 block w-full text-sm text-black file:mr-3 file:rounded-none file:border-0 file:bg-[#f5f5f5] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-black/15"
        />
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
