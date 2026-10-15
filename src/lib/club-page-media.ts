export type PageAction = { label: string; href: string; style: "primary" | "outline"; newTab: boolean };
export type PagePhoto = { src: string; alt: string; caption: string };
export type ClubPageMedia = { layout: "sidebar" | "gallery"; photos: PagePhoto[]; actions: PageAction[] };

export function isPageLink(value: string): boolean {
  if (!value || value.length > 1000 || /[\\\s\u0000-\u001f\u007f]/.test(value)) return false;
  if (/^(\/(?!\/)|#)/.test(value)) return true;
  try { return ["https:", "http:", "mailto:", "tel:"].includes(new URL(value).protocol); }
  catch { return false; }
}

export function parsePageAction(value: unknown): PageAction {
  if (!value || typeof value !== "object") throw new Error("Pārbaudi pogas datus.");
  const action = value as Record<string, unknown>;
  const label = typeof action.label === "string" ? action.label.trim() : "";
  const href = typeof action.href === "string" ? action.href.trim() : "";
  if (!label || label.length > 80) throw new Error("Pogas tekstam jābūt no 1 līdz 80 rakstzīmēm.");
  if (!isPageLink(href)) throw new Error("Pogai norādi derīgu saiti: https://…, /klubs/…, mailto:… vai tel:…");
  return { label, href, style: action.style === "outline" ? "outline" : "primary", newTab: action.newTab === true };
}

/** Existing newline-separated images remain readable; new edits use the same
 * text column for versioned media settings, captions and action buttons. */
export function parseClubPageMedia(raw: string | null | undefined): ClubPageMedia {
  const empty: ClubPageMedia = { layout: "gallery", photos: [], actions: [] };
  if (!raw?.trim()) return empty;
  if (!raw.trim().startsWith("{")) return {
    layout: "sidebar", actions: [],
    photos: raw.split("\n").map(src => src.trim()).filter(Boolean).map(src => ({ src, alt: "", caption: "" })),
  };
  try {
    const data = JSON.parse(raw);
    if (data.version !== 1 || !Array.isArray(data.photos) || !Array.isArray(data.actions)) return empty;
    const photos: PagePhoto[] = data.photos.flatMap((photo: Record<string, unknown>) => {
      if (!photo || typeof photo.src !== "string" || !isPageLink(photo.src) || !/^(\/(?!\/)|https?:\/\/)/i.test(photo.src)) return [];
      return [{ src: photo.src, alt: typeof photo.alt === "string" ? photo.alt.slice(0, 200) : "", caption: typeof photo.caption === "string" ? photo.caption.slice(0, 240) : "" }];
    }).slice(0, 6);
    const actions: PageAction[] = data.actions.flatMap((value: unknown) => {
      try { return [parsePageAction(value)]; } catch { return []; }
    }).slice(0, 6);
    return { layout: data.layout === "sidebar" ? "sidebar" : "gallery", photos, actions };
  } catch { return empty; }
}

export function serializeClubPageMedia(media: ClubPageMedia): string | null {
  return media.photos.length || media.actions.length ? JSON.stringify({ version: 1, ...media }) : null;
}
