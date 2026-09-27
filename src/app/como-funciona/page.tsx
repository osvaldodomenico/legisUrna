import { DisclaimerBanner } from "@/components/ui/Disclaimer";

export const metadata = { title: "Como funciona — LegisUrna" };

export default function ComoFunciona() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <DisclaimerBanner className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-center text-xs font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" />
      <h1 className="text-2xl font-bold">Como funciona</h1>
      <ol className="list-inside list-decimal space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
        <li>A simulação usa as candidaturas de São Paulo.</li>
        <li>Digite o número do candidato no teclado — a candidatura só aparece quando o número estiver completo.</li>
        <li>Confira foto, nome de urna e partido. Use <strong>Corrige</strong> para apagar e <strong>Branco</strong> para voto em branco.</li>
        <li>Pressione <strong>Confirma</strong> para avançar ao próximo cargo.</li>
        <li>A ordem é: Senador 1ª vaga → Senador 2ª vaga → Governador → Presidente. A 2ª vaga ao Senado não pode repetir a 1ª.</li>
        <li>Ao final aparece <strong>FIM</strong>. Nada do que você digitou é enviado a servidor.</li>
      </ol>
      <p className="text-xs text-slate-500">Teclado físico: 0-9 digitam, Backspace/Esc corrige, B branco, Enter confirma.</p>
    </main>
  );
}
