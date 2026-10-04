"use client";

import { useActionState } from "react";

import type { SiteSettings } from "@/lib/site-settings";

import { updateSiteSettings } from "./actions";

const FIELD_CLASS =
  "mt-1.5 w-full rounded-none border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: keyof SiteSettings;
  defaultValue: string;
  type?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-black">
      {label}
      <input
        type={type}
        name={name}
        required
        defaultValue={defaultValue}
        className={FIELD_CLASS}
      />
    </label>
  );
}

export function SiteSettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction, pending] = useActionState(
    updateSiteSettings,
    undefined,
  );

  return (
    <form action={formAction} className="max-w-lg">
      <h1 className="mb-1 text-2xl font-semibold text-black">
        Iestatījumi
      </h1>
      <p className="mb-6 text-sm text-black/55">
        Maini kluba kontaktinformāciju, rekvizītus un saites joslā virs galvenes.
      </p>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold uppercase">Galvenes joslas pogas</h2>
        <p className="text-sm text-black/55">Pogas tiek rādītas šādā secībā. Mobilajā skatā redzama tikai pirmā poga līdzās FKOLAINE.COM.</p>
        <div className="grid gap-4 border-b border-black/15 pb-5 sm:grid-cols-2">
          <Field label="1. pogas nosaukums" name="headerTvName" defaultValue={settings.headerTvName} />
          <Field label="1. pogas saite" name="headerTvUrl" defaultValue={settings.headerTvUrl} />
          <Field label="2. pogas nosaukums" name="headerJoinName" defaultValue={settings.headerJoinName} />
          <Field label="2. pogas saite" name="headerJoinUrl" defaultValue={settings.headerJoinUrl} />
          <Field label="3. pogas nosaukums" name="headerFederationName" defaultValue={settings.headerFederationName} />
          <Field label="3. pogas saite" name="headerFederationUrl" defaultValue={settings.headerFederationUrl} />
          <p className="text-xs leading-relaxed text-black/55 sm:col-span-2">Saite #pievienojies atver pieteikšanās paneli. Vari norādīt arī citu mājaslapas adresi vai saiti uz šīs vietnes lapu, piemēram, /kontakti.</p>
        </div>
        <h2 className="mt-2 text-lg font-semibold uppercase">Kluba informācija</h2>
        <Field
          label="Biedrības nosaukums"
          name="legalName"
          defaultValue={settings.legalName}
        />
        <Field
          label="Juridiskā adrese"
          name="legalAddress"
          defaultValue={settings.legalAddress}
        />
        <Field
          label="Reģistrācijas numurs"
          name="regNr"
          defaultValue={settings.regNr}
        />

        <div className="mt-2 border-t border-black/15 pt-4">
          <p className="text-xs font-bold tracking-[0.15em] text-black/45 uppercase">
            Bankas rekvizīti
          </p>
        </div>
        <Field
          label="Bankas nosaukums"
          name="bankName"
          defaultValue={settings.bankName}
        />
        <Field
          label="Konta numurs"
          name="bankAccount"
          defaultValue={settings.bankAccount}
        />
        <Field label="Kods" name="bankCode" defaultValue={settings.bankCode} />

        <div className="mt-2 border-t border-black/15 pt-4">
          <p className="text-xs font-bold tracking-[0.15em] text-black/45 uppercase">
            Kontakti
          </p>
        </div>
        <Field
          label="Stadiona adrese"
          name="stadiumAddress"
          defaultValue={settings.stadiumAddress}
        />
        <Field label="Tālrunis" name="phone" defaultValue={settings.phone} />
        <Field
          label="E-pasts"
          name="email"
          type="email"
          defaultValue={settings.email}
        />
      </div>

      {state?.error && (
        <p className="mt-4 text-sm font-semibold text-club-red">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="mt-4 text-sm font-semibold text-green-600">
          Saglabāts!
        </p>
      )}

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
