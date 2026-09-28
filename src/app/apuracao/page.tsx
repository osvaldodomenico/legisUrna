import { MOCK_CANDIDATES } from "@/data/mock-candidates";
import { db } from "@/lib/db";
import { apurar } from "@/lib/apuracao/apurar";
import { contarVotos, resumo } from "@/lib/apuracao/repo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Apuração — LegisUrna", robots: { index: false, follow: false } };

const n = (v: number) => v.toLocaleString("pt-BR");

/** Resultado da simulação. Uso interno ShiftLegis — protegido por senha no proxy, nunca público. */
export default async function Apuracao() {
  const sql = db();
  if (!sql) {
    return <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 text-sm">Banco não configurado (DATABASE_URL).</main>;
  }
  const [linhas, r] = await Promise.all([contarVotos(sql), resumo(sql)]);
  const resultado = apurar(linhas, MOCK_CANDIDATES);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-center text-xs font-semibold text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
        USO INTERNO — resultado de simulação, não é pesquisa eleitoral. Não divulgar números nem prints.
      </div>
      <h1 className="text-2xl font-bold">Apuração da simulação</h1>

      <dl className="grid grid-cols-3 gap-3 text-center">
        {[
          ["Simulações", r.simulacoes],
          ["Últimas 24h", r.ultimas24h],
          ["Contatos", r.contatos],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <dt className="text-xs text-slate-500">{rotulo}</dt>
            <dd className="text-2xl font-bold tabular-nums">{n(valor as number)}</dd>
          </div>
        ))}
      </dl>
      <a href="/apuracao/contatos.csv" className="self-start text-sm font-semibold text-blue-700 underline dark:text-blue-400">
        Baixar contatos (CSV)
      </a>

      {resultado.map((cargo) => (
        <section key={cargo.chave} className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">{cargo.titulo}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left text-xs text-slate-500 dark:border-slate-600">
                <th className="py-1 font-medium">Candidatura</th>
                <th className="py-1 font-medium">Nº</th>
                <th className="py-1 text-right font-medium">Votos</th>
                <th className="py-1 text-right font-medium">% válidos</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {cargo.candidatos.map((c) => (
                <tr key={c.candidatoId} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-1">{c.nome} <span className="text-xs text-slate-500">({c.partido})</span></td>
                  <td className="py-1">{c.numero}</td>
                  <td className="py-1 text-right">{n(c.votos)}</td>
                  <td className="py-1 text-right">{c.pctValidos.toLocaleString("pt-BR")}%</td>
                </tr>
              ))}
              {cargo.candidatos.length === 0 && (
                <tr><td colSpan={4} className="py-2 text-slate-500">Nenhum voto em candidatura ainda.</td></tr>
              )}
              <tr className="text-slate-600 dark:text-slate-400"><td className="py-1" colSpan={2}>Válidos</td><td className="py-1 text-right">{n(cargo.validos)}</td><td /></tr>
              <tr className="text-slate-600 dark:text-slate-400"><td className="py-1" colSpan={2}>Brancos</td><td className="py-1 text-right">{n(cargo.brancos)}</td><td /></tr>
              <tr className="text-slate-600 dark:text-slate-400"><td className="py-1" colSpan={2}>Nulos</td><td className="py-1 text-right">{n(cargo.nulos)}</td><td /></tr>
              <tr className="font-semibold"><td className="py-1" colSpan={2}>Total</td><td className="py-1 text-right">{n(cargo.total)}</td><td /></tr>
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}
