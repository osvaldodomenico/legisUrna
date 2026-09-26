import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES } from "@/data/states";
import { DisclaimerBanner } from "@/components/ui/Disclaimer";

export default async function ConfirmState({ params }: PageProps<"/simular/[uf]">) {
  const { uf } = await params;
  const state = STATES.find((s) => s.code === uf.toUpperCase());
  if (!state) notFound();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 px-4 py-10 text-center">
      <DisclaimerBanner className="w-full rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" />
      <h1 className="text-2xl font-bold">{state.name}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Você vai votar nas 6 etapas oficiais: Deputado Federal, Deputado Estadual, Senador (2 vagas), Governador e Presidente.
      </p>
      <Link
        href={`/simular/${state.code}/votar`}
        className="w-full rounded-lg bg-sky-700 px-6 py-3 text-lg font-semibold text-white transition hover:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
      >
        Iniciar votação
      </Link>
      <Link href="/simular" className="text-sm underline">Trocar estado</Link>
    </main>
  );
}
