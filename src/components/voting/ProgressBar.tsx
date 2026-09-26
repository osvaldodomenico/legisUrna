"use client";

import type { OfficeConfig } from "@/domain/voting/types";

export function ProgressBar({ offices, currentIndex }: { offices: OfficeConfig[]; currentIndex: number }) {
  return (
    <nav aria-label="Progresso da votação" className="w-full">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {offices.map((o, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={o.key} className="flex items-center gap-2">
              <span
                aria-current={active ? "step" : undefined}
                className={[
                  "rounded-full px-2.5 py-1",
                  done ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" : "",
                  active ? "bg-sky-600 font-semibold text-white" : "",
                  !done && !active ? "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400" : "",
                ].join(" ")}
              >
                {o.label}
              </span>
              {i < offices.length - 1 && <span aria-hidden className="text-slate-400">→</span>}
            </li>
          );
        })}
      </ol>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar"
        aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={offices.length}
        aria-label={`Etapa ${currentIndex + 1} de ${offices.length}`}>
        <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${((currentIndex + 1) / offices.length) * 100}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500 sm:hidden">
        Etapa {currentIndex + 1} de {offices.length}
      </p>
    </nav>
  );
}
