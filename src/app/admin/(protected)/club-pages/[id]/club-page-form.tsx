"use client";

import { useActionState, useState } from "react";
import Image from "next/image";

import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { createClubPage, updateClubPage } from "../actions";

type ClubPage = {
  id: number;
  title: string;
  slug: string;
  description: string;
  body: string;
  images: string | null;
  displayOrder: number;
  isPublished: boolean;
};

const FIELD = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function ClubPageForm(props: { mode: "create" } | { mode: "edit"; page: ClubPage }) {
  const page = props.mode === "edit" ? props.page : null;
  const action = props.mode === "create" ? createClubPage : updateClubPage.bind(null, props.page.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(props.mode === "edit");
  const images = page?.images?.split("\n").filter(Boolean) ?? [];

  return (
    <form action={formAction} className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauna kluba lapa" : "Rediģēt kluba lapu"}
      </h1>
      <p className="mb-6 text-sm text-slate-500">Publicēta lapa automātiski parādīsies izvēlnē “Klubs”.</p>

      <label className="block text-sm font-semibold text-club-navy">
        Virsraksts
        <input name="title" required maxLength={120} defaultValue={page?.title ?? ""}
          onChange={(event) => { if (!slugTouched) setSlug(slugify(event.target.value)); }} className={FIELD} />
      </label>
      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Lapas saite
        <div className="mt-1.5 flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-club-red">
          <span className="shrink-0 pl-3 text-sm text-slate-400">/klubs/</span>
          <input name="slug" required maxLength={100} value={slug}
            onChange={(event) => { setSlugTouched(true); setSlug(slugify(event.target.value)); }}
            className="min-w-0 flex-1 rounded-lg px-1 py-2 text-sm text-club-navy outline-none" />
        </div>
      </label>
      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Īsais apraksts
        <textarea name="description" required maxLength={240} rows={2} defaultValue={page?.description ?? ""} className={FIELD} />
        <span className="mt-1 block text-xs font-normal text-slate-400">Redzams zem lapas virsraksta un meklētāju rezultātos.</span>
      </label>
      <div className="mt-4 text-sm font-semibold text-club-navy">
        Lapas teksts
        <RichTextEditor name="body" defaultValue={page?.body ?? ""} />
      </div>
      <div className="mt-4">
        <span className="block text-sm font-semibold text-club-navy">Labās kolonnas attēli</span>
        {images.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((url) => (
              <label key={url} className="relative overflow-hidden rounded-lg border border-slate-200 bg-white">
                <span className="relative block aspect-[4/3]"><Image src={url} alt="" fill sizes="180px" className="object-cover" /></span>
                <span className="flex items-center gap-2 p-2 text-xs font-medium text-slate-600">
                  <input type="checkbox" name="removeImages" value={url} className="accent-club-red" /> Noņemt
                </span>
              </label>
            ))}
          </div>
        )}
        <input type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple
          className="mt-2 block w-full text-sm text-club-navy file:mr-3 file:rounded-lg file:border-0 file:bg-club-gray-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-club-navy hover:file:bg-slate-200" />
        <span className="mt-1 block text-xs text-slate-400">Līdz 6 attēliem, katrs ne lielāks par 5 MB.</span>
      </div>
      <label className="mt-4 block max-w-40 text-sm font-semibold text-club-navy">
        Secība izvēlnē
        <input type="number" name="displayOrder" step={1} defaultValue={page?.displayOrder ?? 0} className={FIELD} />
      </label>
      <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-club-navy">
        <input type="checkbox" name="isPublished" defaultChecked={page?.isPublished ?? true} className="h-4 w-4 accent-club-red" />
        Publicēta un redzama izvēlnē
      </label>
      {state?.error && <p className="mt-4 text-sm font-semibold text-club-red">{state.error}</p>}
      <button type="submit" disabled={pending}
        className="mt-6 rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50">
        {pending ? "Saglabā..." : "Saglabāt"}
      </button>
    </form>
  );
}
