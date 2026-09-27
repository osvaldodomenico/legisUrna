import Link from "next/link";
import { DisclaimerBanner } from "@/components/ui/Disclaimer";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-8 px-4 py-10 text-center">
      <DisclaimerBanner className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" />

      <div className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-bold sm:text-4xl">Simulador de Votação 2026</h1>
        <p className="max-w-xl text-slate-700 dark:text-slate-300">
          Treine o fluxo de votação das Eleições Gerais de 2026 numa réplica da urna: digite o número, veja a
          candidatura, confirme. Ordem oficial de votação, do TSE.
        </p>
      </div>

      <ol className="grid gap-2 text-left text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
        <li>1. Deputado Federal (4 dígitos)</li>
        <li>2. Deputado Estadual ou Distrital (5 dígitos)</li>
        <li>3. Senador — 1ª vaga (3 dígitos)</li>
        <li>4. Senador — 2ª vaga (3 dígitos)</li>
        <li>5. Governador (2 dígitos)</li>
        <li>6. Presidente (2 dígitos)</li>
      </ol>

      <Link
        href="/simular"
        className="urna-key urna-key--fn urna-key--confirma flex min-h-16 w-full max-w-xs items-center justify-center !text-lg"
      >
        COMEÇAR SIMULAÇÃO
      </Link>
    </main>
  );
}
