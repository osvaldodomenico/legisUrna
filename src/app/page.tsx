import Link from "next/link";
import { DisclaimerBanner } from "@/components/ui/Disclaimer";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-6 px-4 py-10 text-center">
      <DisclaimerBanner className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" />
      <h1 className="text-3xl font-bold sm:text-4xl">Simulador de Votação 2026</h1>
      <p className="max-w-xl text-slate-600 dark:text-slate-400">
        Treine o fluxo de votação das Eleições Gerais de 2026: digite o número, veja a
        candidatura, confirme. Ordem oficial de votação, do TSE.
      </p>
      <ol className="grid gap-2 text-left text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-2">
        <li>1. Deputado Federal (4 dígitos)</li>
        <li>2. Deputado Estadual ou Distrital (5 dígitos)</li>
        <li>3. Senador — 1ª vaga (3 dígitos)</li>
        <li>4. Senador — 2ª vaga (3 dígitos)</li>
        <li>5. Governador (2 dígitos)</li>
        <li>6. Presidente (2 dígitos)</li>
      </ol>
      <Link
        href="/simular"
        className="rounded-lg bg-sky-700 px-6 py-3 text-lg font-semibold text-white transition hover:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
      >
        Começar simulação
      </Link>
      <p className="text-xs text-slate-500">
        Sua escolha não é enviada a nenhum servidor. Nenhuma informação pessoal é registrada.
      </p>
    </main>
  );
}
