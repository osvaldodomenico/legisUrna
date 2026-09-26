"use client";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "CORRIGE", "0", "BRANCO"];

export function NumericKeypad({ onDigit, onCorrect, onBlank }: {
  onDigit: (d: string) => void;
  onCorrect: () => void;
  onBlank: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Teclado numérico">
      {KEYS.map((k) => {
        const label = k === "CORRIGE" ? "Corrige" : k === "BRANCO" ? "Branco" : k;
        const action = k === "CORRIGE" ? onCorrect : k === "BRANCO" ? onBlank : () => onDigit(k);
        return (
          <button
            key={k}
            type="button"
            onClick={action}
            className="min-h-14 min-w-14 rounded-lg border border-slate-300 bg-white text-lg font-semibold text-slate-900 shadow-sm transition active:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:active:bg-slate-700 dark:focus-visible:outline-sky-400"
            style={k.length > 1 ? { fontSize: "0.75rem" } : undefined}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
