"use client";

import { useActionState } from "react";

import { login } from "./actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-club-gray-light px-6">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-bold text-club-navy">FK Olaine admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ievadi administratora paroli, lai turpinātu.
        </p>

        <label className="mt-6 block text-sm font-semibold text-club-navy">
          Parole
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>

        {state?.error && (
          <p className="mt-3 text-sm font-semibold text-club-red">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-lg bg-club-red py-2.5 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50"
        >
          {pending ? "Ielogojas..." : "Ielogoties"}
        </button>
      </form>
    </div>
  );
}
