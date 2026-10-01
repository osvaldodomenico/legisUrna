import postgres from "postgres";

let client: postgres.Sql | null = null;

/** Conexão única, criada no primeiro uso (o build não precisa de banco). Null sem DATABASE_URL. */
export function db(): postgres.Sql | null {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  // PGlite (pnpm dev:db) atende uma conexão por vez: com mais de uma, o pool derruba o
  // pedido com ECONNRESET. Em Postgres de verdade é só subir o valor (ou deixar 5).
  const max = Number(process.env.DATABASE_MAX ?? 1) || 1;
  client = postgres(url, { max, idle_timeout: 30, connect_timeout: 5 });
  return client;
}
