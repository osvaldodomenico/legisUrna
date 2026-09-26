import { DisclaimerBanner } from "@/components/ui/Disclaimer";

export const metadata = { title: "Privacidade — LegisUrna" };

export default function Privacidade() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <DisclaimerBanner className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-center text-xs font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" />
      <h1 className="text-2xl font-bold">Política de privacidade</h1>
      <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
        <p><strong>Simulação não oficial.</strong> Este site não pertence ao TSE. Nada do que você digita como voto é enviado a servidor, salvo em banco ou compartilhado.</p>
        <p><strong>O que fica no navegador:</strong> apenas o estado temporário da simulação (cargo atual, dígitos digitados) em memória. Ao ver FIM a sessão é limpa.</p>
        <p><strong>Analytics agregado (sem voto):</strong> podemos medir apenas eventos como simulação iniciada/concluída, abandono por etapa, uso de branco/corrige — nunca candidate_id, número ou partido.</p>
        <p><strong>Cookies:</strong> mínimos, se houver, apenas para preferências e medição agregada com IP anonimizado quando suportado.</p>
        <p><strong>LGPD:</strong> não coletamos dados pessoais para esta simulação. Logs com retenção mínima. Sem fingerprint eleitoral.</p>
        <p className="text-xs text-slate-500">Dúvidas: use o canal de contato do projeto LegisUrna.</p>
      </div>
    </main>
  );
}
