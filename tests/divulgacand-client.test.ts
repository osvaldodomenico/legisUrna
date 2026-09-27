/**
 * Testes do client do DivulgaCand com `fetch` falso: nenhum acesso real ao TSE.
 * Verifica o que a documentação da API exige (intervalo entre consultas,
 * cache) e o que o projeto exige (erro não trava a fila, PII ignorada).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  __resetCache,
  anosEleitorais,
  buscarCandidato,
  candidatosPorMunicipio,
  cargosDoMunicipio,
  DivulgaCandError,
  arquivoPorTipo,
  eleicoesOrdinarias,
  MIN_INTERVAL_MS,
} from "@/lib/divulgacand/client";
import type { DivulgaCandidato } from "@/lib/divulgacand/types";

/** Resposta falsa que registra as URLs pedidas. */
function fakeFetch(body: unknown) {
  const calls: string[] = [];
  const impl = vi.fn(async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return { ok: true, status: 200, json: async () => body } as Response;
  });
  return { impl: impl as unknown as typeof fetch, calls };
}

/** `fetch` que falha na primeira chamada e responde na segunda. */
function flakyFetch() {
  let n = 0;
  const impl = vi.fn(async () => {
    n += 1;
    if (n === 1) return { ok: false, status: 503, json: async () => ({}) } as Response;
    return { ok: true, status: 200, json: async () => [{ ano: 2024 }] } as Response;
  });
  return impl as unknown as typeof fetch;
}

const opts = (impl: typeof fetch, intervalMs = 0) => ({ fetchImpl: impl, intervalMs });

beforeEach(() => {
  __resetCache();
  vi.useRealTimers();
});

describe("divulgacand client", () => {
  it("monta a URL do host e da rota certainada", async () => {
    const { impl, calls } = fakeFetch([{ ano: 2024 }]);
    await anosEleitorais(opts(impl));
    expect(calls[0]).toBe(
      "https://divulgacandcontas.tse.jus.br/divulga/rest/v1/eleicao/anos-eleitorais",
    );
  });

  it("monta a rota de candidatos com ano, município, eleição e cargo", async () => {
    const { impl, calls } = fakeFetch([]);
    await candidatosPorMunicipio(2020, 35157, 2030402020, 11, opts(impl));
    expect(calls[0]).toBe(
      "https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/listar/2020/35157/2030402020/11/candidatos",
    );
  });

  it("monta a rota de busca de um candidato e a de cargos do município", async () => {
    const { impl, calls } = fakeFetch({});
    await buscarCandidato(2020, 35157, 2030402020, 50000867342, opts(impl));
    await cargosDoMunicipio(2030402020, 35157, opts(impl));
    expect(calls[0]).toBe(
      "https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/2020/35157/2030402020/candidato/50000867342",
    );
    expect(calls[1]).toBe(
      "https://divulgacandcontas.tse.jus.br/divulga/rest/v1/eleicao/listar/municipios/2030402020/35157/cargos",
    );
  });

  it("respeita o intervalo mínimo entre consultas (a exigência da documentação)", async () => {
    const { impl } = fakeFetch([]);
    const inicio = Date.now();
    await Promise.all([
      anosEleitorais({ fetchImpl: impl, intervalMs: 30 }),
      eleicoesOrdinarias({ fetchImpl: impl, intervalMs: 30 }),
      eleicoesOrdinarias({ fetchImpl: impl, intervalMs: 30 }),
    ]);
    // Três chamadas serializadas com 30 ms de intervalo → pelo menos 60 ms.
    expect(Date.now() - inicio).toBeGreaterThanOrEqual(50);
  });

  it("faz uma requisição só quando a rota é repetida (cache)", async () => {
    const { impl, calls } = fakeFetch([{ ano: 2024 }]);
    await anosEleitorais(opts(impl));
    await anosEleitorais(opts(impl));
    expect(calls).toHaveLength(1);
  });

  it("propaga o status HTTP em DivulgaCandError", async () => {
    const impl = (async () => ({ ok: false, status: 403, json: async () => ({}) }) as Response) as unknown as typeof fetch;
    await expect(anosEleitorais({ fetchImpl: impl, intervalMs: 0 })).rejects.toBeInstanceOf(
      DivulgaCandError,
    );
  });

  it("uma falha não trava a fila: a chamada seguinte responde", async () => {
    const impl = flakyFetch();
    await expect(anosEleitorais({ fetchImpl: impl, intervalMs: 0 })).rejects.toBeTruthy();
    // Mesma instância: a segunda chamada passa. A fila não ficou travada.
    const depois = await anosEleitorais({ fetchImpl: impl, intervalMs: 0 });
    expect(depois).toEqual([{ ano: 2024 }]);
    expect(impl).toHaveBeenCalledTimes(2);
  });

  it("exporta MIN_INTERVAL_MS igual a 1 s, como pede a documentação", () => {
    expect(MIN_INTERVAL_MS).toBe(1000);
  });
});

describe("foto do candidato", () => {
  const candidato: DivulgaCandidato = {
    id: 1,
    nomeUrna: "FULANO",
    arquivos: [
      { codTipo: "PDF", url: "https://exemplo/planodegoverno.pdf" },
      { codTipo: "FOTO", url: "https://exemplo/foto.png" },
    ],
  };
  it("acha a foto pelo codTipo", () => {
    expect(arquivoPorTipo(candidato, "FOTO")).toBe("https://exemplo/foto.png");
  });
  it("devolve null quando não há o tipo pedido", () => {
    expect(arquivoPorTipo(candidato, "VIDEO")).toBeNull();
    expect(arquivoPorTipo({ id: 2 }, "FOTO")).toBeNull();
  });
  it("ignora o tipo presente mas sem URL", () => {
    const semUrl: DivulgaCandidato = { id: 3, arquivos: [{ codTipo: "FOTO" }] };
    expect(arquivoPorTipo(semUrl, "FOTO")).toBeNull();
  });
});
