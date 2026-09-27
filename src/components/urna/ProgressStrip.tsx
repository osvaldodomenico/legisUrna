import type { OfficeConfig } from "@/domain/voting/types";

interface Props {
  offices: OfficeConfig[];
  currentIndex: number;
  finished?: boolean;
}

/** Linha fina acima da urna com os cargos. Desktop: lista; celular: "Cargo n de N" + barra. */
export function ProgressStrip({ offices, currentIndex, finished = false }: Props) {
  const total = offices.length;
  const step = finished ? total : currentIndex + 1;
  return (
    <nav aria-label="Progresso da votação" className="w-full max-w-[980px]">
      <ol className="hidden flex-wrap items-center gap-x-3 gap-y-1 text-xs md:flex">
        {offices.map((o, i) => {
          const done = finished || i < currentIndex;
          const active = !finished && i === currentIndex;
          return (
            <li
              key={o.key}
              aria-current={active ? "step" : undefined}
              className={[
                "rounded-full px-2.5 py-1",
                done ? "bg-emerald-700 text-white" : "",
                active ? "bg-slate-900 font-semibold text-white dark:bg-white dark:text-slate-900" : "",
                !done && !active ? "bg-slate-300/70 text-slate-700 dark:bg-slate-700 dark:text-slate-300" : "",
              ].join(" ")}
            >
              {o.label}
            </li>
          );
        })}
      </ol>
      <div className="md:hidden">
        <p className="text-xs text-slate-600 dark:text-slate-300">Cargo {step} de {total}</p>
        <div
          className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-300/70 dark:bg-slate-700"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`Cargo ${step} de ${total}`}
        >
          <div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${(step / total) * 100}%` }} />
        </div>
      </div>
    </nav>
  );
}
