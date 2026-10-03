"use client";

import Image from "next/image";
import { useActionState } from "react";

import { createPartner, updatePartner } from "../actions";

type Partner = {
  id: number;
  name: string;
  logoUrl: string;
  size: "lg" | "sm";
  needsWhite: boolean;
  websiteUrl: string | null;
};

export function PartnerForm(
  props: { mode: "create" } | { mode: "edit"; partner: Partner },
) {
  const action =
    props.mode === "create" ? createPartner : updatePartner.bind(null, props.partner.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const partner = props.mode === "edit" ? props.partner : null;

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-black">
        {props.mode === "create" ? "Jauns partneris" : "Rediģēt partneri"}
      </h1>

      <label className="block text-sm font-semibold text-black">
        Nosaukums
        <input
          type="text"
          name="name"
          required
          placeholder="Latvijas Futbola Federācija"
          defaultValue={partner?.name ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>

      <div className="mt-4">
        <span className="block text-sm font-semibold text-black">Logotips</span>
        {partner?.logoUrl && (
          <Image
            src={partner.logoUrl}
            alt={partner.name}
            width={120}
            height={80}
            className="mt-1.5 h-16 w-28 rounded-none bg-[#f5f5f5] object-contain p-1"
          />
        )}
        <input
          type="file"
          name="logo"
          accept="image/*"
          required={props.mode === "create"}
          className="mt-1.5 block w-full text-sm text-black file:mr-3 file:rounded-none file:border-0 file:bg-[#f5f5f5] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-black/15"
        />
        <p className="mt-1.5 text-xs text-black/45">
          Šis pats logotips tiek rādīts arī kājenē (tumšā fonā) — vajadzības gadījumā to var
          invertēt uz baltu ar zemāk esošo opciju.
        </p>
      </div>

      <label className="mt-4 block text-sm font-semibold text-black">
        Izmērs
        <select
          name="size"
          required
          defaultValue={partner?.size ?? "lg"}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        >
          <option value="lg">Liels</option>
          <option value="sm">Mazs</option>
        </select>
      </label>

      <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-black">
        <input type="checkbox" name="needsWhite" defaultChecked={partner?.needsWhite ?? false} />
        Balts uz tumša fona (invertē logotipu kājenē)
      </label>

      <label className="mt-4 block text-sm font-semibold text-black">
        Saite (nav obligāta)
        <input
          type="url"
          name="websiteUrl"
          placeholder="https://example.com"
          defaultValue={partner?.websiteUrl ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
        <p className="mt-1.5 text-xs text-black/45">
          Ja aizpildīts, logotips būs klikšķināms un atvērs šo saiti jaunā cilnē.
        </p>
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
