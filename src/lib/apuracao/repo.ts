import type postgres from "postgres";
import type { ContagemVoto } from "./apurar";
import { CONSENTIMENTO_TEXTO, CONSENTIMENTO_VERSAO } from "./consentimento";
import type { ContatoGravavel, SimulacaoGravavel } from "./payload";

export async function gravarSimulacao(sql: postgres.Sql, s: SimulacaoGravavel): Promise<void> {
  await sql.begin(async (tx) => {
    const [{ id }] = await tx<{ id: string }[]>`INSERT INTO simulacoes (estado) VALUES (${s.estado}) RETURNING id`;
    const linhas = s.votos.map((v) => ({ simulacao_id: id, cargo: v.cargo, tipo: v.tipo, candidato_id: v.candidatoId }));
    await tx`INSERT INTO votos ${tx(linhas, "simulacao_id", "cargo", "tipo", "candidato_id")}`;
  });
}

/** Mesmo WhatsApp de novo atualiza o nome e reativa quem tinha saído (novo consentimento). */
export async function gravarContato(sql: postgres.Sql, c: ContatoGravavel): Promise<void> {
  await sql`
    INSERT INTO contatos (nome, whatsapp, consentimento_versao, consentimento_texto)
    VALUES (${c.nome}, ${c.whatsapp}, ${CONSENTIMENTO_VERSAO}, ${CONSENTIMENTO_TEXTO})
    ON CONFLICT (whatsapp) DO UPDATE SET
      nome = EXCLUDED.nome,
      consentimento_versao = EXCLUDED.consentimento_versao,
      consentimento_texto = EXCLUDED.consentimento_texto,
      criado_em = now(),
      descadastrado_em = NULL`;
}

export async function contarVotos(sql: postgres.Sql): Promise<ContagemVoto[]> {
  return sql<ContagemVoto[]>`
    SELECT cargo, tipo, candidato_id AS "candidatoId", count(*)::int AS n
    FROM votos GROUP BY cargo, tipo, candidato_id`;
}

export async function resumo(sql: postgres.Sql): Promise<{ simulacoes: number; ultimas24h: number; contatos: number }> {
  const [r] = await sql<{ simulacoes: number; ultimas24h: number; contatos: number }[]>`
    SELECT
      (SELECT count(*)::int FROM simulacoes) AS simulacoes,
      (SELECT count(*)::int FROM simulacoes WHERE hora > now() - interval '24 hours') AS ultimas24h,
      (SELECT count(*)::int FROM contatos WHERE descadastrado_em IS NULL) AS contatos`;
  return r;
}

export async function listarContatos(sql: postgres.Sql) {
  return sql<{ nome: string; whatsapp: string; criado_em: Date; consentimento_versao: string }[]>`
    SELECT nome, whatsapp, criado_em, consentimento_versao
    FROM contatos WHERE descadastrado_em IS NULL ORDER BY criado_em`;
}
