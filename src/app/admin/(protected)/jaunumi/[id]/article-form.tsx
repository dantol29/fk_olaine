"use client";

import Image from "next/image";
import { useActionState } from "react";

import { createArticle, updateArticle } from "../actions";

const CATEGORIES = ["Klubs", "Komandas", "Spēles", "Treniņi", "Pasākumi"] as const;

type Article = {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  category: (typeof CATEGORIES)[number];
  teamId: number | null;
  authorCoachId: number | null;
  image: string;
  body: string;
  highlights: string | null;
};
type TeamOption = { id: number; name: string };
type CoachOption = { id: number; name: string };

export function ArticleForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[]; coachOptions: CoachOption[] }
    | { mode: "edit"; article: Article; teamOptions: TeamOption[]; coachOptions: CoachOption[] },
) {
  const action =
    props.mode === "create" ? createArticle : updateArticle.bind(null, props.article.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const article = props.mode === "edit" ? props.article : null;

  const highlightUrls = article?.highlights?.split("\n").filter(Boolean) ?? [];

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-black">
        {props.mode === "create" ? "Jauns raksts" : "Rediģēt rakstu"}
      </h1>

      <label className="block text-sm font-semibold text-black">
        Virsraksts
        <input
          type="text"
          name="title"
          required
          defaultValue={article?.title ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-black">
        Ievads
        <textarea
          name="excerpt"
          required
          rows={2}
          defaultValue={article?.excerpt ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>

      <div className="mt-4 flex gap-4">
        <label className="block flex-1 text-sm font-semibold text-black">
          Datums
          <input
            type="date"
            name="date"
            required
            defaultValue={article?.date ?? ""}
            className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
          />
        </label>

        <label className="block flex-1 text-sm font-semibold text-black">
          Kategorija
          <select
            name="category"
            required
            defaultValue={article?.category ?? ""}
            className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
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

      <label className="mt-4 block text-sm font-semibold text-black">
        Komanda (nav obligāts)
        <select
          name="teamId"
          defaultValue={article?.teamId ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        >
          <option value="">—</option>
          {props.teamOptions.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-semibold text-black">
        Autors (nav obligāts)
        <select
          name="authorCoachId"
          defaultValue={article?.authorCoachId ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        >
          <option value="">—</option>
          {props.coachOptions.map((coach) => (
            <option key={coach.id} value={coach.id}>
              {coach.name}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-black/45">
          Autora vārds un foto rakstā tiek ņemti no izvēlētā trenera profila.
        </p>
      </label>

      <div className="mt-4">
        <span className="block text-sm font-semibold text-black">Attēls</span>
        {article?.image && (
          <Image
            src={article.image}
            alt={article.title}
            width={120}
            height={80}
            className="mt-1.5 h-20 w-32 rounded-none object-cover"
          />
        )}
        <input
          type="file"
          name="image"
          accept="image/*"
          required={props.mode === "create"}
          className="mt-1.5 block w-full text-sm text-black file:mr-3 file:rounded-none file:border-0 file:bg-[#f5f5f5] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-black/15"
        />
      </div>

      <label className="mt-4 block text-sm font-semibold text-black">
        Teksts (katra rindkopa jaunā rindā)
        <textarea
          name="body"
          required
          rows={8}
          defaultValue={article?.body ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>


      <div className="mt-4">
        <span className="block text-sm font-semibold text-black">
          Galerija (nav obligāts)
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
                className="h-14 w-14 rounded-none object-cover"
              />
            ))}
          </div>
        )}
        <input
          type="file"
          name="highlights"
          accept="image/*"
          multiple
          className="mt-1.5 block w-full text-sm text-black file:mr-3 file:rounded-none file:border-0 file:bg-[#f5f5f5] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-black/15"
        />
        <p className="mt-1 text-xs text-black/45">Jaunu attēlu augšupielāde aizstās esošos.</p>
        {highlightUrls.length > 0 && (
          <label className="mt-2 flex items-center gap-2 text-sm text-black">
            <input type="checkbox" name="removeHighlights" />
            Noņemt esošos attēlus
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
