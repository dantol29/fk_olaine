"use client";

import { useActionState } from "react";
import Image from "next/image";

import { createLeagueSource, updateLeagueSource } from "../actions";

type LeagueSource = {
  id: number;
  teamId: number;
  label: string;
  logoUrl: string | null;
  url: string;
  standingsUrl: string | null;
  topScorersUrl: string | null;
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
      <h1 className="mb-6 text-2xl font-semibold text-black">
        {props.mode === "create" ? "Jauns līgas avots" : "Rediģēt līgas avotu"}
      </h1>

      <label className="block text-sm font-semibold text-black">
        Nosaukums
        <input
          type="text"
          name="label"
          required
          placeholder="Sieviešu līga"
          defaultValue={source?.label ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-black">
          Līgas logo (nav obligāts)
          <input type="file" name="logo" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm file:mr-3 file:rounded-none file:border-0 file:bg-[#e8e8e8] file:px-3 file:py-2" />
        </label>
        <p className="mt-2 text-xs text-black/45">JPEG, PNG vai WebP, līdz 5 MB. Ja logo nav pievienots, tabulā parādās FK Olaine logo.</p>
        {source?.logoUrl && (
          <div className="mt-3">
            <Image src={source.logoUrl} alt={source.label} width={80} height={80} className="size-20 object-contain" />
            <label className="mt-2 flex items-center gap-2 text-sm text-black"><input type="checkbox" name="removeLogo" />Noņemt logo</label>
          </div>
        )}
      </div>

      <label className="mt-4 block text-sm font-semibold text-black">
        Komanda
        <select
          name="teamId"
          required
          defaultValue={source?.teamId ?? ""}
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

      <label className="mt-4 block text-sm font-semibold text-black">
        LFF spēļu saraksta URL
        <input
          type="url"
          name="url"
          required
          placeholder="https://lff.lv/sacensibas/sievietes/sieviesu-futbola-liga/?tab=content_1_2"
          defaultValue={source?.url ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-black">
        LFF tabulas URL (nav obligāts)
        <input
          type="url"
          name="standingsUrl"
          placeholder="https://lff.lv/sacensibas/sievietes/sieviesu-futbola-liga/?tab=content_1_4"
          defaultValue={source?.standingsUrl ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>
      <p className="mt-1.5 text-xs text-black/45">
        Tas pats sacensību lapā, bet uz &quot;Tabula&quot; cilnes. Ja aizpildīts, šī liga parādās
        mājaslapas galvenajā tabulā.
      </p>

      <label className="mt-4 block text-sm font-semibold text-black">
        LFF vārtu guvēju URL (nav obligāts)
        <input
          type="url"
          name="topScorersUrl"
          placeholder="https://lff.lv/sacensibas/sievietes/sieviesu-futbola-liga/?tab=content_1_3"
          defaultValue={source?.topScorersUrl ?? ""}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>
      <p className="mt-1.5 text-xs text-black/45">
        Tas pats sacensību lapā, bet uz &quot;Vārtu guvēji&quot; cilnes. Ja aizpildīts, šīs komandas
        spēlētāju gūto vārtu skaits tiek sinhronizēts no LFF (pēc vārda sakritības, tikai skaits —
        fotogrāfijas un citi lauki netiek mainīti).
      </p>

      <label className="mt-4 block text-sm font-semibold text-black">
        Secība mājaslapā
        <input
          type="number"
          name="displayOrder"
          step={1}
          defaultValue={source?.displayOrder ?? 0}
          className="mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />
      </label>
      <p className="mt-1.5 text-xs text-black/45">
        Mazāks skaitlis parādās pirmais mājaslapas līgu tabulā.
      </p>

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
