"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { ClubPageMedia } from "@/lib/club-page-media";

export function PagePhotosEditor({ media }: { media: ClubPageMedia }) {
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    return () => photos.forEach(photo => URL.revokeObjectURL(photo.preview));
  }, [photos]);
  return <fieldset className="mt-8 border-t border-black/15 pt-6">
    <legend className="px-1 text-base font-semibold">Fotoattēli un galerija</legend>
    <label className="mb-4 block max-w-sm text-sm font-medium">Attēlu izkārtojums<select name="imageLayout" defaultValue={media.layout} className="mt-1.5 w-full border border-black/15 px-3 py-2 text-sm"><option value="gallery">Foto galerija zem teksta</option><option value="sidebar">Attēli labajā kolonnā</option></select></label>
    <p className="mb-4 text-sm text-slate-500">Galerijā fotoattēlus var atvērt pilnā izmērā. Apraksts redzams zem attēla; alternatīvais teksts apraksta attēlu ekrānlasītājiem.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      {media.photos.map((photo, index) => <div key={photo.src} className="min-w-0 border border-black/15 bg-white p-3">
        <Image src={photo.src} alt={photo.alt} width={400} height={300} className="aspect-[4/3] w-full object-cover" />
        <label className="mt-3 block text-xs font-medium">Apraksts<input name={`imageCaption:${photo.src}`} maxLength={240} defaultValue={photo.caption} className="mt-1 w-full border border-black/15 px-2 py-2 text-sm" /></label>
        <label className="mt-3 block text-xs font-medium">Alternatīvais teksts<input name={`imageAlt:${photo.src}`} maxLength={200} defaultValue={photo.alt} className="mt-1 w-full border border-black/15 px-2 py-2 text-sm" /></label>
        <label className="mt-3 flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" name="removeImages" value={photo.src} />Noņemt {index + 1}. attēlu</label>
      </div>)}
    </div>
    <label className="mt-4 block text-sm font-medium">Pievienot fotoattēlus<input type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple onChange={event => {
      const files = Array.from(event.target.files ?? []);
      const message = files.length > 6 ? "Izvēlies ne vairāk kā 6 attēlus." : files.reduce((sum, file) => sum + file.size, 0) > 5 * 1024 * 1024 ? "Vienā reizē augšupielādē līdz 5 MB attēlu." : "";
      event.target.setCustomValidity(message);
      setError(message);
      setPhotos(message ? [] : files.map(file => ({ file, preview: URL.createObjectURL(file) })));
    }} className="mt-2 block w-full text-sm file:mr-3 file:border-0 file:bg-club-gray-light file:px-3 file:py-2 file:font-semibold" /></label>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    <p className="mt-2 text-xs text-slate-500">Līdz 6 attēliem. Katrs līdz 5 MB; viena augšupielāde kopā līdz 5 MB. Lielākus attēlus pievieno vairākās saglabāšanas reizēs.</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">{photos.map(({ file, preview }) => <div key={preview} className="min-w-0 border border-black/15 bg-white p-3">
      <Image src={preview} alt="Jaunā fotoattēla priekšskatījums" width={400} height={300} unoptimized className="aspect-[4/3] w-full object-cover" />
      <p className="mt-2 truncate text-xs text-slate-500">{file.name}</p>
      <label className="mt-3 block text-xs font-medium">Apraksts<input name="newImageCaption" maxLength={240} className="mt-1 w-full border border-black/15 px-2 py-2 text-sm" /></label>
      <label className="mt-3 block text-xs font-medium">Alternatīvais teksts<input name="newImageAlt" maxLength={200} className="mt-1 w-full border border-black/15 px-2 py-2 text-sm" /></label>
    </div>)}</div>
  </fieldset>;
}
