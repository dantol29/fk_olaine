"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Expand, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { PagePhoto } from "@/lib/club-page-media";

export function ClubPageGallery({ photos, title, layout }: { photos: PagePhoto[]; title: string; layout: "gallery" | "sidebar" }) {
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const id = useId();
  const open = active !== null;
  const photo = active === null ? null : photos[active];
  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    const returnTo = trigger.current;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    close.current?.focus();
    return () => { element.close(); document.body.style.overflow = overflow; returnTo?.focus(); };
  }, [open]);
  function move(offset: number) {
    setActive(current => current === null ? null : (current + offset + photos.length) % photos.length);
  }
  if (!photos.length) return null;
  return <section aria-label={`${title} — fotoattēli`} className="min-w-0">
    {layout === "gallery" && <h2 className="mb-6 font-heading text-3xl font-semibold uppercase sm:text-4xl">Foto galerija</h2>}
    <div className={layout === "gallery" ? "grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-3" : "grid content-start gap-6"}>
      {photos.map((item, index) => <figure key={item.src} className="min-w-0">
        <button type="button" aria-label={`Atvērt fotoattēlu ${index + 1}: ${item.alt || item.caption || title}`} aria-haspopup="dialog" onClick={event => { trigger.current = event.currentTarget; setActive(index); }} className="group relative block w-full overflow-hidden bg-club-navy/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-club-red">
          <Image src={item.src} alt={item.alt || `${title} — fotoattēls ${index + 1}`} width={960} height={720} sizes={layout === "gallery" ? "(min-width: 1024px) 30vw, (min-width: 480px) 50vw, 100vw" : "(min-width: 1024px) 40vw, 100vw"} className={layout === "gallery" ? "aspect-[4/3] w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.025] motion-reduce:transition-none" : "h-auto w-full object-contain"} />
          <span className="absolute bottom-3 right-3 grid size-10 place-items-center border border-white/30 bg-black/60 text-white transition-colors group-hover:bg-club-red group-hover:text-white"><Expand className="size-4" aria-hidden="true" /></span>
        </button>
        {item.caption && <figcaption className="mt-3 text-sm leading-relaxed text-club-navy/65">{item.caption}</figcaption>}
      </figure>)}
    </div>
    <dialog ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={photo?.caption ? `${id}-caption` : undefined} onCancel={event => { event.preventDefault(); setActive(null); }} onClick={event => { if (event.target === event.currentTarget) setActive(null); }} onKeyDown={event => {
      if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    }} className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto border-0 bg-club-navy/95 px-4 py-6 text-white backdrop:bg-black/80 sm:px-8">
      <div className="mx-auto flex min-h-full max-w-[1500px] flex-col">
        <div className="flex shrink-0 items-center justify-between gap-4">
          <h2 id={`${id}-title`} className="min-w-0 font-heading text-lg uppercase">{title} <span className="ml-3 whitespace-nowrap text-white/50">{active === null ? "" : `${active + 1} / ${photos.length}`}</span></h2>
          <button ref={close} type="button" aria-label="Aizvērt galeriju" onClick={() => setActive(null)} className="grid size-12 shrink-0 place-items-center border border-white/30 transition-colors hover:border-club-red hover:text-club-red focus-visible:outline-2 focus-visible:outline-club-red"><X className="size-6" /></button>
        </div>
        {photo && <>
          <div className="relative my-5 min-h-[50svh] flex-1 sm:min-h-[60svh]">
            <Image src={photo.src} alt={photo.alt || `${title} — fotoattēls ${(active ?? 0) + 1}`} fill sizes="100vw" className="object-contain" />
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
            <p id={`${id}-caption`} className="max-w-[75ch] text-sm leading-relaxed text-white/75" aria-live="polite">{photo.caption}</p>
            {photos.length > 1 && <div className="ml-auto flex gap-2">
              <button type="button" aria-label="Iepriekšējais fotoattēls" onClick={() => move(-1)} className="grid size-12 place-items-center border border-white/30 transition-colors hover:border-club-red hover:text-club-red focus-visible:outline-2 focus-visible:outline-club-red"><ArrowLeft className="size-5" /></button>
              <button type="button" aria-label="Nākamais fotoattēls" onClick={() => move(1)} className="grid size-12 place-items-center border border-white/30 transition-colors hover:border-club-red hover:text-club-red focus-visible:outline-2 focus-visible:outline-club-red"><ArrowRight className="size-5" /></button>
            </div>}
          </div>
        </>}
      </div>
    </dialog>
  </section>;
}
