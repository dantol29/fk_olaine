/** Lets a homepage card (e.g. the matches carousel) tell the calendar
 *  section, elsewhere on the same page, to jump to and open one specific
 *  event — without lifting shared state up through the server-rendered
 *  page tree. A plain DOM CustomEvent is enough since both sides are
 *  client components mounted in the same document. */
export const OPEN_CALENDAR_EVENT_NAME = "fko:open-calendar-event";

export function dispatchOpenCalendarEvent(uid: string) {
  window.dispatchEvent(
    new CustomEvent<{ uid: string }>(OPEN_CALENDAR_EVENT_NAME, { detail: { uid } }),
  );
}
