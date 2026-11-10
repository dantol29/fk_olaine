import Image from "next/image";
import { getHomeSlides } from "@/lib/home-slides";
import { removeHomeSlide } from "./actions";
import { UploadForm } from "./upload-form";

export default async function HomeSlidesPage() {
  const slides = await getHomeSlides();
  return <div className="max-w-5xl">
    <h1 className="text-2xl font-semibold">Sākumlapas attēli</h1>
    <p className="mt-2 text-sm text-black/60">Attēli automātiski mainās sākumlapas galvenē un nav saistīti ar jaunumiem. Pievieno attēlus pa vienam (JPEG, PNG vai WebP, līdz 5 MB).</p>
    <UploadForm />
    {slides.length === 0 ? <p className="mt-8 text-sm text-black/60">Attēlu vēl nav. Līdz pievienošanai galvenē redzams stadiona attēls.</p> :
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{slides.map((src, index) => <div key={src} className="border border-black/15 p-3">
        <Image src={src} alt={`Sākumlapas attēls ${index + 1}`} width={600} height={400} className="aspect-video w-full object-cover" />
        <form action={removeHomeSlide} className="mt-3"><input type="hidden" name="image" value={src} /><button className="min-h-11 text-sm font-semibold text-red-700 underline">Dzēst attēlu</button></form>
      </div>)}</div>}
  </div>;
}
