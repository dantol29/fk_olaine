import Image from "next/image";
import type { StandingRow } from "@/lib/standings";
import { cn } from "@/lib/utils";

export function StandingsTable({ rows, label, compact = false }: { rows: StandingRow[]; label: string; compact?: boolean }) {
  const columns = compact ? [0, 4, 5] : [0, 1, 2, 3, 4, 5];
  if (!rows.length) return <div className="border border-black/10 px-6 py-16 text-center"><h2 className="text-xl font-semibold">Turnīra tabula pašlaik nav pieejama</h2><p className="mt-3 text-black/55">Izvēlies citu komandu vai atgriezies vēlāk.</p></div>;
  return (
    <div role="region" aria-label={`${label} — turnīra tabula`} tabIndex={0} className="overflow-x-auto">
      <table className={cn("w-full table-fixed border-collapse text-sm", !compact && "sm:min-w-[700px] sm:table-auto sm:text-base")}>
        <caption className="sr-only">{label} — aktuālā turnīra tabula</caption>
        <colgroup>
          <col className={cn("w-6", compact ? "sm:w-8" : "sm:w-12")} /><col />
          {columns.map((index) => <col key={index} className={cn(
            index === 0 && "w-9",
            index > 0 && index < 4 && "hidden sm:table-column",
            index === 4 && "w-10",
            index === 5 && "w-12",
            compact ? index === 0 ? "sm:w-12" : index === 4 ? "sm:w-14" : "sm:w-16" : "sm:w-auto",
          )} />)}
        </colgroup>
        <thead><tr className="border-y-2 border-black text-left uppercase"><th scope="colgroup" className="px-1 py-5 sm:px-3" colSpan={2}>Komanda</th>{columns.map((index) => <th key={index} scope="col" className={cn("px-1 py-5 text-center", compact ? "sm:px-2" : "sm:px-4", index > 0 && index < 4 && "hidden sm:table-cell")}>{["S", "U", "N", "Z", "+/−", "Punkti"][index]}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={`${row.pos}-${row.team}`} className={cn("border-b border-black/10", row.isOlaine && "bg-club-red/10 font-semibold")}>
          <td className={cn("px-1 py-5 text-center text-xs sm:px-3 sm:text-base", row.isOlaine && "text-club-red shadow-[inset_4px_0_0_var(--club-red)]")}>{row.pos}</td>
          <th scope="row" className={cn("px-1 py-4 text-left font-normal sm:px-2", row.isOlaine && "font-bold")}><span className="flex items-center gap-2 sm:gap-3">{row.logo && <Image src={row.logo} alt="" width={28} height={28} className="size-5 shrink-0 object-contain sm:size-7" />}<span className="min-w-0 break-words uppercase">{row.team}</span></span></th>
          {columns.map((index) => <td key={index} className={cn("px-1 py-5 text-center tabular-nums", compact ? "sm:px-2" : "sm:px-4", index > 0 && index < 4 && "hidden sm:table-cell")}>{[row.played, row.wins, row.draws, row.losses, row.goalDiff, row.points][index]}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  );
}
