import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import postgres from "postgres";
import { MOCK_CANDIDATES } from "@/data/mock-candidates";
import { contarVotos, gravarContato, gravarSimulacao, listarContatos, resumo } from "@/lib/apuracao/repo";
import { apurar } from "@/lib/apuracao/apurar";
import type { SimulacaoGravavel } from "@/lib/apuracao/payload";

// Postgres real (PGlite) atrás de um socket: roda o schema.sql e o SQL do repo como na produção.
let pg: PGlite;
let server: PGLiteSocketServer;
let sql: postgres.Sql;
// porta fora da do pnpm dev:db (54329), para os testes rodarem com o dev ligado
const PORT = Number(process.env.TEST_DB_PORT ?? 54330);

beforeAll(async () => {
  pg = await PGlite.create();
  server = new PGLiteSocketServer({ db: pg, port: PORT, host: "127.0.0.1" });
  await server.start();
  sql = postgres(`postgres://postgres@127.0.0.1:${PORT}/postgres`, { max: 1 });
  await sql.unsafe(readFileSync(path.resolve(__dirname, "../db/schema.sql"), "utf8"));
});

afterAll(async () => {
  await sql?.end();
  await server?.stop();
  await pg?.close();
});

const sim = (pres: string | null): SimulacaoGravavel => ({
  estado: "SP",
  votos: [
    { cargo: "federal_deputy", tipo: "branco", candidatoId: null },
    { cargo: "state_deputy", tipo: "candidato", candidatoId: "sp-dep-est-gilmaci" },
    { cargo: "senator_1", tipo: "candidato", candidatoId: "sp-sen-simone-tebet" },
    { cargo: "senator_2", tipo: "nulo", candidatoId: null },
    { cargo: "governor", tipo: "candidato", candidatoId: "sp-gov-haddad" },
    pres ? { cargo: "president", tipo: "candidato", candidatoId: pres } : { cargo: "president", tipo: "branco", candidatoId: null },
  ],
});

describe("banco da apuração", () => {
  it("grava simulações e apura", async () => {
    await gravarSimulacao(sql, sim("br-pres-lula"));
    await gravarSimulacao(sql, sim("br-pres-flavio-bolsonaro"));
    await gravarSimulacao(sql, sim(null));
    const r = apurar(await contarVotos(sql), MOCK_CANDIDATES);
    const pres = r.find((x) => x.chave === "president")!;
    expect(pres.validos).toBe(2);
    expect(pres.brancos).toBe(1);
    expect(pres.total).toBe(3);
    expect((await resumo(sql)).simulacoes).toBe(3);
  });

  it("hora da simulação fica truncada (sem minuto/segundo)", async () => {
    const [{ m }] = await sql<{ m: number }[]>`SELECT max(extract(minute FROM hora) + extract(second FROM hora))::int AS m FROM simulacoes`;
    expect(m).toBe(0);
  });

  it("banco recusa voto de candidato sem candidato_id", async () => {
    await expect(
      sql`INSERT INTO votos (simulacao_id, cargo, tipo, candidato_id) SELECT id, 'x', 'candidato', NULL FROM simulacoes LIMIT 1`
    ).rejects.toThrow();
  });

  it("contato: grava, reenvio do mesmo WhatsApp atualiza, sem duplicar", async () => {
    await gravarContato(sql, { nome: "Ana", whatsapp: "5511912345678" });
    await gravarContato(sql, { nome: "Ana Souza", whatsapp: "5511912345678" });
    const lista = await listarContatos(sql);
    expect(lista).toHaveLength(1);
    expect(lista[0].nome).toBe("Ana Souza");
    expect((await resumo(sql)).contatos).toBe(1);
  });

  it("tabela de contatos não tem nenhuma coluna ligada à simulação", async () => {
    const cols = await sql<{ column_name: string }[]>`SELECT column_name FROM information_schema.columns WHERE table_name = 'contatos'`;
    expect(cols.map((c) => c.column_name).filter((c) => /simul|voto|sess/.test(c))).toEqual([]);
  });
});
