export function parseTrainingInput(formData: FormData) {
  const teamIds = [...new Set(formData.getAll("teamIds").map(Number))];
  const coachIds = [...new Set(formData.getAll("coachIds").map(Number))];
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const location = String(formData.get("location") || formData.get("customLocation") || "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const validId = (id: number) => Number.isSafeInteger(id) && id > 0;
  if (!teamIds.length || !teamIds.every(validId)) return { error: "Jāizvēlas vismaz viena komanda." } as const;
  if (!coachIds.every(validId)) return { error: "Nederīgs treneris." } as const;
  const parsedDate = new Date(`${date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) return { error: "Nederīgs datums." } as const;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) return { error: "Nederīgs sākuma laiks." } as const;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || endTime <= startTime) return { error: "Beigu laikam jābūt pēc sākuma laika." } as const;
  if (!location) return { error: "Vieta ir obligāta." } as const;
  return { teamIds, coachIds, date, startTime, endTime, location, notes: notes || null };
}

export type TrainingInput = Exclude<ReturnType<typeof parseTrainingInput>, { error: string }>;
