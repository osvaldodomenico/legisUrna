// Limite simples por IP, só em memória: o IP nunca vai para o banco nem para log.
const JANELA_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

export function ipDe(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "?";
}

export function excedeu(chave: string, max: number, agora = Date.now()): boolean {
  const recentes = (hits.get(chave) ?? []).filter((t) => agora - t < JANELA_MS);
  recentes.push(agora);
  hits.set(chave, recentes);
  if (hits.size > 10_000) {
    for (const [k, ts] of hits) if (ts.every((t) => agora - t >= JANELA_MS)) hits.delete(k);
  }
  return recentes.length > max;
}
