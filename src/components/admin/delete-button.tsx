"use client";

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
      <button type="submit" className="text-sm font-semibold text-club-red hover:underline">
        Dzēst
      </button>
    </form>
  );
}
