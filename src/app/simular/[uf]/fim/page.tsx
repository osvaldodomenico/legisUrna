"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useVotingSession } from "@/stores/voting-session";
import { track } from "@/lib/analytics";
import { DisclaimerBanner } from "@/components/ui/Disclaimer";

export default function FimPage() {
  const restart = useVotingSession((s) => s.restart);
  const stateCode = useVotingSession((s) => s.stateCode);

  useEffect(() => {
    const t = setTimeout(() => track("simulation_completed", { state: stateCode }), 0);
    return () => clearTimeout(t);
  }, [stateCode]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 px-4 py-16 text-center">
      <DisclaimerBanner className="w-full rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" />
      <p className="text-5xl font-bold tracking-widest" aria-live="assertive">FIM</p>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Votação concluída. Nenhum voto foi gravado, transmitido ou armazenado — nada saiu do seu navegador.
      </p>
      <div className="flex w-full flex-col gap-2">
        <Link
          href={`/simular/${stateCode}/votar`}
          onClick={restart}
          className="rounded-lg bg-sky-700 px-6 py-3 font-semibold text-white transition hover:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          Votar novamente
        </Link>
        <Link href="/" className="rounded-lg border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
          Sair
        </Link>
      </div>
    </main>
  );
}
