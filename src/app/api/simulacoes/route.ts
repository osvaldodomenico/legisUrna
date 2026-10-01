import { CANDIDATOS } from "@/data/candidatos";
import { db } from "@/lib/db";
import { parseSimulacao } from "@/lib/apuracao/payload";
import { gravarSimulacao } from "@/lib/apuracao/repo";
import { excedeu, ipDe } from "@/lib/apuracao/limite";

/** Grava uma simulação concluída, sem nada que identifique quem votou. */
export async function POST(req: Request) {
  if (excedeu("sim:" + ipDe(req), 30)) return new Response(null, { status: 429 });
  const body = await req.json().catch(() => null);
  const s = parseSimulacao(body, CANDIDATOS);
  if (!s) return new Response(null, { status: 400 });
  const sql = db();
  if (!sql) return new Response(null, { status: 503 });
  try {
    await gravarSimulacao(sql, s);
  } catch (e) {
    console.error("[simulacoes] falha ao gravar", (e as Error).message);
    return new Response(null, { status: 500 });
  }
  return new Response(null, { status: 204 });
}
