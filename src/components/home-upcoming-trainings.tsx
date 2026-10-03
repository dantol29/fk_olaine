import { getAllTrainingsFromDb } from "@/lib/trainings-server";
import { TrainingRow } from "@/components/trainings-directory";
import { TrainingsMonthCalendar } from "@/components/trainings-month-calendar";
import { HomeSectionHeading } from "@/components/home-section-heading";

export async function HomeUpcomingTrainings() {
  const trainings = await getAllTrainingsFromDb();
  const displayed = trainings.filter((training) => !training.isPast).sort((a, b) => `${a.rawDate}${a.startTime}`.localeCompare(`${b.rawDate}${b.startTime}`)).slice(0, 4);
  if (trainings.length === 0) return null;
  return <section className="bg-[#fafafa] px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
    <div className="mx-auto max-w-[1600px]">
      <HomeSectionHeading title="Treniņi" href="/treninji" linkLabel="Visi treniņi" />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">{displayed.length ? displayed.map((training) => <div key={training.id}><p className="mb-2 text-xs font-semibold text-black/50 uppercase">{training.teamName}</p><TrainingRow training={training} /></div>) : <p className="border border-black/15 bg-white p-8 text-sm text-black/55">Gaidāmo treniņu pašlaik nav.</p>}</div>
        <TrainingsMonthCalendar trainings={trainings} className="!ml-0 !w-full !rounded-none !bg-black" />
      </div>
    </div>
  </section>;
}
