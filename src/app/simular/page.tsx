import Link from "next/link";
import { STATES } from "@/data/states";
import { DisclaimerBanner } from "@/components/ui/Disclaimer";

export const metadata = { title: "Escolher estado — LegisUrna" };

export default function SelectState() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-6 px-4 py-10">
      <DisclaimerBanner className="w-full rounded-lg border border-amber-300 bg-amber-50 p-3 text-center text-xs font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" />
      <h1 className="text-2xl font-bold">Em qual estado você vota?</h1>
      <p className="text-sm text-slate-700 dark:text-slate-300">
        A escolha define as candidaturas estaduais. Presidente é nacional.
      </p>
      <ul className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
        {STATES.map((s) => (
          <li key={s.code}>
            <Link
              href={`/simular/${s.code}`}
              className="flex min-h-14 items-center justify-center rounded-lg border border-[color:var(--urna-body-dark)] bg-[color:var(--urna-body)] px-3 text-center text-sm font-semibold text-slate-900 shadow-[0_3px_0_var(--urna-body-dark)] transition hover:brightness-105 active:translate-y-[2px] active:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
            >
              {s.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
