import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { NEWS } from "@/lib/news";

export function LatestNewsSection() {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="mt-2 mb-3 flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-base font-bold text-black uppercase sm:text-lg">
          <span className="h-6 w-0.5 shrink-0 rounded-full bg-club-red" />
          Jaunumi
        </h2>
        <Link
          href="/jaunumi"
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase"
        >
          Skatīt visus
          <ArrowRight className="h-3.5 w-3.5 text-club-red" />
        </Link>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
        {NEWS.map((item) => (
          <Link
            key={item.seed}
            href="#"
            className="group flex h-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:h-auto"
          >
            <div className="relative w-2/5 shrink-0 overflow-hidden sm:w-1/2">
              <Image
                src={item.image ?? `https://picsum.photos/seed/${item.seed}/400/400`}
                alt=""
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(min-width: 640px) 15vw, 40vw"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
              <h3 className="line-clamp-2 text-xs leading-snug font-bold text-club-navy sm:text-sm">
                {item.title}
              </h3>
              <div className="flex items-end justify-between gap-2">
                <p className="text-[10px] font-medium text-slate-400 uppercase">
                  {item.date}
                </p>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-club-red text-white transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
