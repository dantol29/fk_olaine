/** Database wrappers put the actionable SQLite error in their cause. */
export function errorMessage(error: unknown): string {
  const seen = new Set<unknown>();
  let current = error;
  let message = String(error);
  while (current instanceof Error && !seen.has(current)) {
    seen.add(current);
    if (current.message) message = current.message;
    current = current.cause;
  }
  return message;
}
