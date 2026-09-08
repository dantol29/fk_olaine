import Image from "next/image";
import { ArrowRight } from "lucide-react";

const NEWS = [
  {
    seed: "fkolaine-news-1",
    title: "FK Olaine izcīna svarīgu uzvaru izbraukumā",
    date: "2. septembris",
  },
  {
    seed: "fkolaine-news-2",
    title: "Spraiga cīņa līdz pēdējai minūtei",
    date: "28. augusts",
  },
  {
    seed: "fkolaine-news-3",
    title: "Nedēļas spēlētāja: intervija ar kapteini",
    date: "20. augusts",
  },
];

export function NewsSection() {
  return (
    <section className="px-6 pb-10">
      {/* Same grid template as the Hero row, so this column matches the photo card's width exactly */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-3 text-lg font-extrabold text-club-navy uppercase">
              <span className="h-5 w-1 rounded-full bg-club-red" />
              Jaunākie jaunumi
            </h2>
            <a
              href="#"
              className="flex items-center gap-1 text-sm font-semibold text-slate-500 "
            >
              Skatīt visus
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {NEWS.map((item) => (
              <a
                key={item.seed}
                href="#"
                className="group flex h-48 overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="relative w-[45%] shrink-0 overflow-hidden">
                  <Image
                    src={`https://picsum.photos/seed/${item.seed}/400/400`}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="45vw"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                  <h3 className="line-clamp-3 text-sm font-bold text-club-navy">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-slate-400 uppercase">
                      {item.date}
                    </p>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-club-red text-white transition-transform group-hover:translate-x-0.5">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
