"use client";
import { useActionState } from "react";
import { addHomeSlide } from "./actions";

export function UploadForm() {
  const [state, action, pending] = useActionState(addHomeSlide, undefined);
  return <form action={action} className="mt-6 flex flex-wrap items-end gap-3">
    <label className="block text-sm font-semibold">Pievienot attēlu
      <input required type="file" name="image" accept="image/jpeg,image/png,image/webp" className="mt-2 block max-w-full text-sm file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold" />
    </label>
    <button disabled={pending} className="min-h-11 bg-club-red px-4 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Augšupielādē..." : "Pievienot"}</button>
    {state?.error && <p role="alert" className="w-full text-sm text-red-700">{state.error}</p>}
    {state?.success && <p role="status" className="w-full text-sm text-green-700">Attēls pievienots.</p>}
  </form>;
}
