/** Keep query context as well as the underlying SQLite error. */
export function errorMessage(error: unknown): string {
  const seen = new Set<unknown>();
  let current = error;
  const messages: string[] = [];
  while (current instanceof Error && !seen.has(current)) {
    seen.add(current);
    if (current.message && !messages.includes(current.message)) messages.push(current.message);
    current = current.cause;
  }
  return messages.length ? messages.join("\nCaused by: ") : String(error);
}
