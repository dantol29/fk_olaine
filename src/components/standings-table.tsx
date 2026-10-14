import Image from "next/image";
import type { StandingRow } from "@/lib/standings";
import { cn } from "@/lib/utils";

export function StandingsTable({ rows, label }: { rows: StandingRow[]; label: string }) {
  if (!rows.length) return <div className="border border-black/10 px-6 py-16 text-center"><h2 className="text-xl font-semibold">Turnīra tabula pašlaik nav pieejama</h2><p className="mt-3 text-black/55">Izvēlies citu komandu vai atgriezies vēlāk.</p></div>;
  return (
    <div role="region" aria-label={`${label} — turnīra tabula`} tabIndex={0} className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-sm sm:min-w-[700px] sm:table-auto sm:text-base">
        <caption className="sr-only">{label} — aktuālā turnīra tabula</caption>
        <colgroup><col className="w-6 sm:w-12" /><col /><col className="w-9 sm:w-auto" /><col className="hidden sm:table-column" /><col className="hidden sm:table-column" /><col className="hidden sm:table-column" /><col className="w-10 sm:w-auto" /><col className="w-12 sm:w-auto" /></colgroup>
        <thead><tr className="border-y-2 border-black text-left uppercase"><th scope="colgroup" className="px-1 py-5 sm:px-3" colSpan={2}>Komanda</th>{["S", "U", "N", "Z", "+/−", "Punkti"].map((name, index) => <th key={name} scope="col" className={cn("px-1 py-5 text-center sm:px-4", index > 0 && index < 4 && "hidden sm:table-cell")}>{name}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={`${row.pos}-${row.team}`} className={cn("border-b border-black/10", row.isOlaine && "bg-black/5 font-semibold")}>
          <td className="px-1 py-5 text-center text-xs sm:px-3 sm:text-base">{row.pos}</td>
          <th scope="row" className="px-1 py-4 text-left font-normal sm:px-2"><span className="flex items-center gap-2 sm:gap-3">{row.logo && <Image src={row.logo} alt="" width={28} height={28} className="size-5 shrink-0 object-contain sm:size-7" />}<span className="min-w-0 break-words uppercase">{row.team}</span></span></th>
          {[row.played, row.wins, row.draws, row.losses, row.goalDiff, row.points].map((value, index) => <td key={index} className={cn("px-1 py-5 text-center tabular-nums sm:px-4", index > 0 && index < 4 && "hidden sm:table-cell")}>{value}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  );
}
