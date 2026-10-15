"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { PageAction } from "@/lib/club-page-media";

const FIELD = "mt-1.5 w-full border border-black/15 px-3 py-2 text-sm";

export function PageActionsEditor({ initialActions }: { initialActions: PageAction[] }) {
  const [actions, setActions] = useState(() => initialActions.map((action, index) => ({ ...action, key: String(index) })));
  function update(key: string, patch: Partial<PageAction>) {
    setActions(current => current.map(action => action.key === key ? { ...action, ...patch } : action));
  }
  function move(index: number, offset: number) {
    setActions(current => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
  }
  return <fieldset className="mt-8 border-t border-black/15 pt-6">
    <legend className="px-1 text-base font-semibold">Darbību pogas</legend>
    <p className="mb-4 text-sm text-slate-500">Pogas zem lapas teksta, piemēram, “Pieteikties” vai “Sazināties”.</p>
    <input type="hidden" name="actionButtons" value={JSON.stringify(actions.map(({ label, href, style, newTab }) => ({ label, href, style, newTab })))} />
    <div className="space-y-4">{actions.map((action, index) => <div key={action.key} className="border border-black/15 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3"><span className="text-sm font-semibold">Poga {index + 1}</span><div className="flex gap-1">
        <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Pārvietot ${index + 1}. pogu augšup`} className="grid size-10 place-items-center disabled:opacity-25"><ArrowUp className="size-4" /></button>
        <button type="button" disabled={index === actions.length - 1} onClick={() => move(index, 1)} aria-label={`Pārvietot ${index + 1}. pogu lejup`} className="grid size-10 place-items-center disabled:opacity-25"><ArrowDown className="size-4" /></button>
        <button type="button" onClick={() => setActions(current => current.filter(row => row.key !== action.key))} aria-label={`Noņemt ${index + 1}. pogu`} className="grid size-10 place-items-center text-red-700"><Trash2 className="size-4" /></button>
      </div></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Pogas teksts<input required maxLength={80} value={action.label} onChange={event => update(action.key, { label: event.target.value })} placeholder="Pieteikties" className={FIELD} /></label>
        <label className="text-sm font-medium">Saite<input required maxLength={1000} value={action.href} onChange={event => update(action.key, { href: event.target.value })} placeholder="https://… vai /klubs/…" className={FIELD} /></label>
        <label className="text-sm font-medium">Izskats<select value={action.style} onChange={event => update(action.key, { style: event.target.value === "outline" ? "outline" : "primary" })} className={FIELD}><option value="primary">Sarkana poga</option><option value="outline">Kontūra</option></select></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={action.newTab} onChange={event => update(action.key, { newTab: event.target.checked })} />Atvērt jaunā cilnē</label>
      </div>
    </div>)}</div>
    <button type="button" disabled={actions.length >= 6} onClick={() => setActions(current => [...current, { key: crypto.randomUUID(), label: "", href: "", style: "primary", newTab: false }])} className="mt-4 flex min-h-11 items-center gap-2 border border-black/15 px-4 text-sm disabled:opacity-40"><Plus className="size-4" />Pievienot pogu</button>
  </fieldset>;
}
