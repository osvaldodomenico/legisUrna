import { DisclaimerBanner } from "@/components/ui/Disclaimer";

export const metadata = { title: "Privacidade — LegisUrna" };

export default function Privacidade() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <DisclaimerBanner className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-center text-xs font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" />
      <h1 className="text-2xl font-bold">Política de privacidade</h1>
      <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
        <p><strong>Simulação não oficial.</strong> Este site não pertence ao TSE. O responsável pelos dados é a <strong>ShiftLegis</strong>.</p>
        <p><strong>Simulações (anônimas):</strong> ao ver FIM, a simulação é gravada para uma apuração interna: em cada cargo, se o voto foi para uma candidatura, branco ou nulo. Não gravamos nome, telefone, IP, dispositivo nem o horário exato — só a hora cheia e o estado. Não há como saber quem fez qual simulação. Os resultados são de uso interno e não são divulgados.</p>
        <p><strong>Cadastro opcional:</strong> no fim, você pode escolher receber informações da ShiftLegis pelo WhatsApp. Se aceitar, guardamos nome, WhatsApp, a data e o texto que você autorizou. Esse cadastro fica separado da simulação: não é ligado aos seus votos.</p>
        <p><strong>Seus direitos (LGPD):</strong> responda SAIR a qualquer mensagem da ShiftLegis para sair da lista na hora. Para pedir acesso, correção ou exclusão do cadastro, responda a qualquer mensagem pedindo isso.</p>
        <p><strong>Analytics:</strong> usamos o Google Analytics para contar visitas e páginas acessadas (dados agregados de navegação, como dispositivo e região aproximada). Seus votos na simulação nunca são enviados: nada de candidatura, número ou partido.</p>
        <p><strong>Cookies:</strong> o Google Analytics usa cookies de medição de audiência (<code>_ga</code>). Além disso, o navegador guarda só uma marca de que você já respondeu o convite, para não perguntar de novo.</p>
        <p className="text-xs text-slate-500">Dúvidas: use o canal de contato do projeto LegisUrna.</p>
      </div>
    </main>
  );
}
