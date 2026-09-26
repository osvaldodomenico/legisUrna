import { DisclaimerBanner } from "@/components/ui/Disclaimer";

export const metadata = { title: "Termos — LegisUrna" };

export default function Termos() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <DisclaimerBanner className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-center text-xs font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" />
      <h1 className="text-2xl font-bold">Termos e aviso</h1>
      <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
        <p><strong>SIMULAÇÃO NÃO OFICIAL</strong> — Este simulador é independente, para treinamento da sequência de votação. Não pertence, não representa e não é operado pelo TSE ou pela Justiça Eleitoral. Não use brasão da República ou marca do TSE.</p>
        <p>Não há coleta de voto, ranking, placar ou pesquisa eleitoral. Candidatos fictícios aqui são apenas para desenvolvimento e serão substituídos por cadastro administrativo.</p>
        <p>Use por sua conta: a ordem e os dígitos seguem a divulgação oficial das Eleições 2026 (TSE), mas o sistema não substitui a urna oficial.</p>
      </div>
    </main>
  );
}
