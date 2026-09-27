/**
 * Client da API do DivulgaCandContas (TSE).
 *
 * Restrições que a própria documentação da API impõe e que valem aqui:
 *   - "coloque um intervalo de tempo entre as consultas, para não sobrecarregar
 *      os servidores do TSE" → todo GET passa por `throttle` (1 requisição a cada
 *      `MIN_INTERVAL_MS`, com uma única fila).
 *   - "use a API apenas se os dados não estiverem disponíveis nos downloads" →
 *      este client serve a consulta pontual (plano de governo, situação, recorte
 *      por município). Ingestão de base continua sendo pelos dados abertos.
 *
 * Não há autenticação, contrato versionado nem SLA. O host responde `Access
 * Denied` (CDN/Akamai) para IP fora do Brasil, então este client só funciona
 * rodando de uma conexão brasileira.
 */
import type {
  DivulgaAnoEleitoral,
  DivulgaCandidato,
  DivulgaCargo,
  DivulgaEleicaoOrdinaria,
  DivulgaMunicipio,
} from "./types";

const BASE = "https://divulgacandcontas.tse.jus.br/divulga/rest/v1";

/** Intervalo mínimo entre duas requisições, conforme a documentação da API. */
export const MIN_INTERVAL_MS = 1000;

/** Quantas respostas ficam em memória por chave de rota. */
const CACHE_MAX = 200;

const cache = new Map<string, unknown>();
/** Instante (ms) da última requisição disparada. */
let lastRequestAt = 0;
/** Tail da fila: garante uma requisição por vez, sem `setInterval`. */
let queue: Promise<unknown> = Promise.resolve();

export class DivulgaCandError extends Error {
  constructor(readonly status: number, readonly path: string) {
    super(`DivulgaCand ${status} em ${path}`);
    this.name = "DivulgaCandError";
  }
}

export interface ClientOptions {
  /** Só para teste: injetar `fetch` e o relógio. */
  fetchImpl?: typeof fetch;
  intervalMs?: number;
}

/** Espera até poder disparar, preservando a ordem das chamadas. */
function throttle(intervalMs: number): Promise<void> {
  const wait = Math.max(0, lastRequestAt + intervalMs - Date.now());
  lastRequestAt = Date.now() + wait;
  return new Promise((resolve) => setTimeout(resolve, wait));
}

async function get<T>(path: string, options: ClientOptions): Promise<T> {
  const cached = cache.get(path);
  if (cached !== undefined) return cached as T;

  const doFetch = options.fetchImpl ?? fetch;
  // Serializa: uma requisição por vez, na ordem em que foram pedidas.
  const run = queue.then(async () => {
    await throttle(options.intervalMs ?? MIN_INTERVAL_MS);
    const res = await doFetch(`${BASE}${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new DivulgaCandError(res.status, path);
    return (await res.json()) as T;
  });
  // Um erro em uma chamada não pode travar a fila das seguintes.
  queue = run.then(
    () => undefined,
    () => undefined,
  );

  const data = await run;
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(path, data);
  return data;
}

/** Só para teste. */
export function __resetCache(): void {
  cache.clear();
  lastRequestAt = 0;
  queue = Promise.resolve();
}

/** Anos com eleições realizadas (ex.: `[2018, 2020, 2022, 2024]`). */
export function anosEleitorais(options: ClientOptions = {}): Promise<DivulgaAnoEleitoral[]> {
  return get<DivulgaAnoEleitoral[]>("/eleicao/anos-eleitorais", options);
}

/** Eleições ordinárias (nacionais, estaduais e municipais). */
export function eleicoesOrdinarias(options: ClientOptions = {}): Promise<DivulgaEleicaoOrdinaria[]> {
  return get<DivulgaEleicaoOrdinaria[]>("/eleicao/ordinarias", options);
}

/** Cargos em disputa num município. */
export function cargosDoMunicipio(
  eleicao: number | string,
  municipio: number | string,
  options: ClientOptions = {},
): Promise<DivulgaCargo[]> {
  return get<DivulgaCargo[]>(`/eleicao/listar/municipios/${eleicao}/${municipio}/cargos`, options);
}

/** Candidatos a um cargo, num município. É a única rota de listagem que existe. */
export function candidatosPorMunicipio(
  ano: number | string,
  municipio: number | string,
  eleicao: number | string,
  cargo: number | string,
  options: ClientOptions = {},
): Promise<DivulgaCandidato[]> {
  return get<DivulgaCandidato[]>(
    `/candidatura/listar/${ano}/${municipio}/${eleicao}/${cargo}/candidatos`,
    options,
  );
}

/** Um candidato, com partido, situação da eleição e anexos (foto). */
export function buscarCandidato(
  ano: number | string,
  municipio: number | string,
  eleicao: number | string,
  candidato: number | string,
  options: ClientOptions = {},
): Promise<DivulgaCandidato> {
  return get<DivulgaCandidato>(
    `/candidatura/buscar/${ano}/${municipio}/${eleicao}/candidato/${candidato}`,
    options,
  );
}

/** Primeiro arquivo cujo `codTipo` casa com os tipos informados (ex.: foto). */
export function arquivoPorTipo(candidato: DivulgaCandidato, ...codTipos: string[]): string | null {
  const arquivos = candidato.arquivos ?? [];
  for (const cod of codTipos) {
    const achado = arquivos.find((a) => a.codTipo === cod && a.url);
    if (achado?.url) return achado.url;
  }
  return null;
}

/** Lista de municípios do tipo usado nas rotas do TSE (código IBGE + UF). */
export type Municipio = DivulgaMunicipio;
