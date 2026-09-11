import { BirthdaysCarousel } from "@/components/birthdays-carousel";
import { getBirthdaysTimeline } from "@/lib/birthdays-server";

export async function BirthdaysSection() {
  const timeline = await getBirthdaysTimeline(3);
  if (!timeline.center) return null;

  return (
    <section className="px-6 pb-8 pt-16">
      <div className="relative mx-auto max-w-[1440px]">
        <div className="relative mb-5 flex min-h-24 flex-col items-center justify-center sm:mb-6 sm:min-h-32 sm:items-start">
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[4.75rem] leading-none font-extrabold tracking-tight whitespace-nowrap text-club-navy/[0.06] uppercase select-none sm:text-8xl"
          >
            Birthdays
          </span>
          <h2 className="relative text-center text-3xl tracking-[-0.02em] text-club-navy sm:text-left sm:text-4xl">
            Dzimšanas dienas
          </h2>
        </div>
        <div className="-mx-6 sm:mx-0">
          <BirthdaysCarousel {...timeline} />
        </div>
      </div>
    </section>
  );
}
