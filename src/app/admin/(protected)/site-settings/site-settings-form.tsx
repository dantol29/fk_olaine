"use client";

import { useActionState } from "react";

import type { SiteSettings } from "@/lib/site-settings";

import { updateSiteSettings } from "./actions";

const FIELD_CLASS =
  "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red";

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
    <label className="block text-sm font-semibold text-club-navy">
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
      <h1 className="mb-1 text-2xl font-extrabold text-club-navy">
        Iestatījumi
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Šī informācija tiek rādīta mājaslapas kājenē (Biedrība, Kontakti).
      </p>

      <div className="flex flex-col gap-4">
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

        <div className="mt-2 border-t border-slate-200 pt-4">
          <p className="text-xs font-bold tracking-[0.15em] text-slate-400 uppercase">
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

        <div className="mt-2 border-t border-slate-200 pt-4">
          <p className="text-xs font-bold tracking-[0.15em] text-slate-400 uppercase">
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
        className="mt-6 rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50"
      >
        {pending ? "Saglabā..." : "Saglabāt"}
      </button>
    </form>
  );
}
