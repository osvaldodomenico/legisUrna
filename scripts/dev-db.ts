/**
 * Postgres local de desenvolvimento, sem Docker: PGlite (WASM) atrás de um socket
 * TCP. Aplica db/schema.sql na subida e guarda os dados em .vitest/dev-db
 * (git-ignored). Os testes usam a mesma teknologia.
 *
 *   pnpm dev:db
 *     sobe o banco e a próxima instrução imprime a URL para colar no terminal do app
 *   pnpm dev:db -- sobe em background, com log em .vitest/dev-db.log
 *   pnpm dev:db:stop
 *     derruba o processo em background
 *   pnpm dev
 *     liga no banco (porta e usuário fixos; a senha do /apuracao continua na .env.local)
 */
import { openSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const PORT = Number(process.env.DEV_DB_PORT ?? 54329);
// os testes usam 54330 (tests/apuracao-db.test.ts) para não brigar com esta porta
const HOST = "127.0.0.1";
const RAIZ = path.resolve(__dirname, "..");
const DADOS = path.join(RAIZ, ".vitest/dev-db");
const ARQ_PID = path.join(RAIZ, ".vitest/dev-db.pid");
const ARQ_LOG = path.join(RAIZ, ".vitest/dev-db.log");
const EM_BACKGROUND = process.argv.includes("--background") || process.env.DEV_DB_BACKGROUND === "1";
const STOP = process.argv.includes("--stop");

const url = `postgres://postgres@${HOST}:${PORT}/postgres`;
const espera = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function portaLivre(): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.connect({ port: PORT, host: HOST });
    s.on("connect", () => { s.destroy(); resolve(false); });
    s.on("error", () => resolve(true));
  });
}

async function derrubar(): Promise<boolean> {
  try {
    const pid = Number(readFileSync(ARQ_PID, "utf8").trim());
    if (!Number.isFinite(pid) || pid <= 0) return false;
    process.kill(pid, "SIGTERM");
    for (let i = 0; i < 20 && !(await portaLivre()); i++) await espera(100);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  if (STOP) {
    const derrubado = await derrubar();
    if (!derrubado && !(await portaLivre())) throw new Error(`nenhum dev-db em ${HOST}:${PORT}`);
    console.log(derrubado ? "[dev-db] banco parado" : "[dev-db] nada rodando");
    return;
  }
  if (!EM_BACKGROUND) {
    // Em primeiro plano o Ctrl-C encerra; em background quem encerra é dev:db:stop.
    if (!(await derrubar()) && !(await portaLivre())) {
      throw new Error(`a porta ${PORT} já está em uso por outro processo`);
    }
  }

  const log = (msg: string): void => console.log(`[dev-db] ${msg}`);

  if (EM_BACKGROUND && process.env.DEV_DB_BACKGROUND !== "1") {
    // este processo é só o-cego: o banner com o PID e a URL sai no log do filho
    writeFileSync(ARQ_LOG, "");
    const filho = spawn(process.execPath, [path.join(RAIZ, "node_modules/tsx/dist/cli.mjs"), __filename], {
      cwd: RAIZ,
      detached: true,
      stdio: ["ignore", openSync(ARQ_LOG, "a"), openSync(ARQ_LOG, "a")],
      env: { ...process.env, DEV_DB_BACKGROUND: "1" },
    });
    filho.unref();
    for (let i = 0; i < 150 && !readFileSync(ARQ_LOG, "utf8").includes("pronto"); i++) await espera(200);
    if (!(await portaLivre())) console.log(readFileSync(ARQ_LOG, "utf8").trimEnd());
    return;
  }

  const pg = await PGlite.create({ dataDir: DADOS });
  const server = new PGLiteSocketServer({ db: pg, port: PORT, host: HOST });
  await server.start();
  await pg.exec(readFileSync(path.join(RAIZ, "db/schema.sql"), "utf8"));
  log(`pronto em ${url}`);
  log(`dados em ${path.relative(RAIZ, DADOS)}`);
  log("");
  log(`DATABASE_URL=${url}   # .env.local`);
  if (process.env.DEV_DB_BACKGROUND) {
    writeFileSync(ARQ_PID, String(process.pid));
  }
  const encerrar = (): void => {
    void (async () => {
      try { unlinkSync(ARQ_PID); } catch { /* já removido */ }
      await server.stop();
      await pg.close();
      process.exit(0);
    })();
  };
  process.on("SIGINT", encerrar);
  process.on("SIGTERM", encerrar);
}

void main().catch((e: unknown) => {
  console.error(`[dev-db] ${(e as Error).message}`);
  process.exit(1);
});
