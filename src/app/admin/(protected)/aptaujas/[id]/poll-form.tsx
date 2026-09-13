"use client";

import { Plus, X } from "lucide-react";
import { useActionState, useState } from "react";

import { createPoll, updatePoll } from "../actions";

type Option = { id: number | null; key: string; label: string };

type Poll = {
  id: number;
  question: string;
  options: { id: number; label: string }[];
};

function emptyOption(): Option {
  return { id: null, key: crypto.randomUUID(), label: "" };
}

export function PollForm(props: { mode: "create" } | { mode: "edit"; poll: Poll }) {
  const action = props.mode === "create" ? createPoll : updatePoll.bind(null, props.poll.id);
  const [state, formAction, pending] = useActionState(action, undefined);

  const [options, setOptions] = useState<Option[]>(() =>
    props.mode === "edit" && props.poll.options.length > 0
      ? props.poll.options.map((option) => ({
          id: option.id,
          key: `existing-${option.id}`,
          label: option.label,
        }))
      : [emptyOption(), emptyOption()],
  );

  function updateLabel(key: string, label: string) {
    setOptions((current) => current.map((option) => (option.key === key ? { ...option, label } : option)));
  }

  function addOption() {
    setOptions((current) => [...current, emptyOption()]);
  }

  function removeOption(key: string) {
    setOptions((current) =>
      current.length <= 2 ? current : current.filter((option) => option.key !== key),
    );
  }

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauna aptauja" : "Rediģēt aptauju"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Jautājums
        <input
          type="text"
          name="question"
          required
          placeholder="Kurai komandai tu sekosi visvairāk šosezon?"
          defaultValue={props.mode === "edit" ? props.poll.question : ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-club-navy">Atbilžu varianti</legend>
        <div className="mt-1.5 flex flex-col gap-2">
          {options.map((option) => (
            <div key={option.key} className="flex items-center gap-2">
              <input type="hidden" name="optionId" value={option.id ?? ""} />
              <input
                type="text"
                name="optionLabel"
                required
                value={option.label}
                onChange={(event) => updateLabel(option.key, event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
              />
              <button
                type="button"
                onClick={() => removeOption(option.key)}
                disabled={options.length <= 2}
                aria-label="Noņemt variantu"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-club-red transition hover:bg-club-red/10 disabled:pointer-events-none disabled:opacity-30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-club-navy hover:text-club-red"
        >
          <Plus className="h-4 w-4" />
          Pievienot variantu
        </button>
      </fieldset>

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
