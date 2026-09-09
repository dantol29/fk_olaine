"use client";

import { useActionState } from "react";

import { createLeagueSource, updateLeagueSource } from "../actions";

type LeagueSource = {
  id: number;
  teamId: number;
  label: string;
  url: string;
  standingsUrl: string | null;
  displayOrder: number;
};
type TeamOption = { id: number; name: string };

export function LeagueSourceForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[] }
    | { mode: "edit"; source: LeagueSource; teamOptions: TeamOption[] },
) {
  const action =
    props.mode === "create" ? createLeagueSource : updateLeagueSource.bind(null, props.source.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const source = props.mode === "edit" ? props.source : null;

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauns līgas avots" : "Rediģēt līgas avotu"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Nosaukums
        <input
          type="text"
          name="label"
          required
          placeholder="Sieviešu līga"
          defaultValue={source?.label ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Komanda
        <select
          name="teamId"
          required
          defaultValue={source?.teamId ?? ""}
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
        LFF spēļu saraksta URL
        <input
          type="url"
          name="url"
          required
          placeholder="https://lff.lv/sacensibas/sievietes/sieviesu-futbola-liga/?tab=content_1_2"
          defaultValue={source?.url ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        LFF tabulas URL (nav obligāts)
        <input
          type="url"
          name="standingsUrl"
          placeholder="https://lff.lv/sacensibas/sievietes/sieviesu-futbola-liga/?tab=content_1_4"
          defaultValue={source?.standingsUrl ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>
      <p className="mt-1.5 text-xs text-slate-400">
        Tas pats sacensību lapā, bet uz &quot;Tabula&quot; cilnes. Ja aizpildīts, šī liga parādās
        mājaslapas galvenajā tabulā.
      </p>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Secība mājaslapā
        <input
          type="number"
          name="displayOrder"
          step={1}
          defaultValue={source?.displayOrder ?? 0}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>
      <p className="mt-1.5 text-xs text-slate-400">
        Mazāks skaitlis parādās pirmais mājaslapas līgu tabulā.
      </p>

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
