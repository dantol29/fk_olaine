"use client";

import { Trash2 } from "lucide-react";

export function DeleteButton({
  action,
  confirmMessage,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        aria-label="Dzēst"
        title="Dzēst"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-club-red transition hover:bg-club-red/10"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
