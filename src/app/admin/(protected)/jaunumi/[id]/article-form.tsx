"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { createArticle, updateArticle } from "../actions";

const CATEGORIES = ["Klubs", "Komandas", "Spēles", "Treniņi", "Pasākumi"] as const;

type Article = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: (typeof CATEGORIES)[number];
  teamId: number | null;
  image: string;
  body: string;
  quoteText: string | null;
  quoteAuthor: string | null;
  quoteRole: string | null;
  highlights: string | null;
  closing: string | null;
  signature: string | null;
  featured: boolean;
};
type TeamOption = { id: number; name: string };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[āä]/g, "a")
    .replace(/[čć]/g, "c")
    .replace(/[ēé]/g, "e")
    .replace(/ģ/g, "g")
    .replace(/[īí]/g, "i")
    .replace(/ķ/g, "k")
    .replace(/ļ/g, "l")
    .replace(/ņ/g, "n")
    .replace(/[šś]/g, "s")
    .replace(/[ūü]/g, "u")
    .replace(/[žź]/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ArticleForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[] }
    | { mode: "edit"; article: Article; teamOptions: TeamOption[] },
) {
  const action =
    props.mode === "create" ? createArticle : updateArticle.bind(null, props.article.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const article = props.mode === "edit" ? props.article : null;

  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(props.mode === "edit");
  const highlightUrls = article?.highlights?.split("\n").filter(Boolean) ?? [];

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauns raksts" : "Rediģēt rakstu"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Virsraksts
        <input
          type="text"
          name="title"
          required
          defaultValue={article?.title ?? ""}
          onChange={(event) => {
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Saite (slug)
        <input
          type="text"
          name="slug"
          required
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Ievads
        <textarea
          name="excerpt"
          required
          rows={2}
          defaultValue={article?.excerpt ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <div className="mt-4 flex gap-4">
        <label className="block flex-1 text-sm font-semibold text-club-navy">
          Datums
          <input
            type="date"
            name="date"
            required
            defaultValue={article?.date ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>

        <label className="block flex-1 text-sm font-semibold text-club-navy">
          Kategorija
          <select
            name="category"
            required
            defaultValue={article?.category ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          >
            <option value="" disabled>
              Izvēlies...
            </option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Komanda (nav obligāts)
        <select
          name="teamId"
          defaultValue={article?.teamId ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        >
          <option value="">—</option>
          {props.teamOptions.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4">
        <span className="block text-sm font-semibold text-club-navy">Attēls</span>
        {article?.image && (
          <Image
            src={article.image}
            alt={article.title}
            width={120}
            height={80}
            className="mt-1.5 h-20 w-32 rounded-lg object-cover"
          />
        )}
        <input
          type="file"
          name="image"
          accept="image/*"
          required={props.mode === "create"}
          className="mt-1.5 block w-full text-sm text-club-navy file:mr-3 file:rounded-lg file:border-0 file:bg-club-gray-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-club-navy hover:file:bg-slate-200"
        />
      </div>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Teksts (katra rindkopa jaunā rindā)
        <textarea
          name="body"
          required
          rows={8}
          defaultValue={article?.body ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <fieldset className="mt-4 rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-sm font-semibold text-club-navy">
          Citāts (nav obligāts)
        </legend>
        <label className="block text-sm text-club-navy">
          Teksts
          <textarea
            name="quoteText"
            rows={2}
            defaultValue={article?.quoteText ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
        <label className="mt-2 block text-sm text-club-navy">
          Autors
          <input
            type="text"
            name="quoteAuthor"
            defaultValue={article?.quoteAuthor ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
        <label className="mt-2 block text-sm text-club-navy">
          Amats
          <input
            type="text"
            name="quoteRole"
            defaultValue={article?.quoteRole ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
      </fieldset>

      <div className="mt-4">
        <span className="block text-sm font-semibold text-club-navy">
          Spilgtākie momenti (nav obligāts)
        </span>
        {highlightUrls.length > 0 && (
          <div className="mt-1.5 flex gap-2">
            {highlightUrls.map((url) => (
              <Image
                key={url}
                src={url}
                alt=""
                width={60}
                height={60}
                className="h-14 w-14 rounded-lg object-cover"
              />
            ))}
          </div>
        )}
        <input
          type="file"
          name="highlights"
          accept="image/*"
          multiple
          className="mt-1.5 block w-full text-sm text-club-navy file:mr-3 file:rounded-lg file:border-0 file:bg-club-gray-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-club-navy hover:file:bg-slate-200"
        />
        <p className="mt-1 text-xs text-slate-400">Jaunu attēlu augšupielāde aizstās esošos.</p>
        {highlightUrls.length > 0 && (
          <label className="mt-2 flex items-center gap-2 text-sm text-club-navy">
            <input type="checkbox" name="removeHighlights" />
            Noņemt esošos attēlus
          </label>
        )}
      </div>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Noslēgums (nav obligāts)
        <textarea
          name="closing"
          rows={2}
          defaultValue={article?.closing ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Paraksts (nav obligāts)
        <input
          type="text"
          name="signature"
          defaultValue={article?.signature ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-club-navy">
        <input type="checkbox" name="featured" defaultChecked={article?.featured ?? false} />
        Rādīt sadaļā &ldquo;Izceltie raksti&rdquo;
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
