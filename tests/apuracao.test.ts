import { describe, it, expect } from "vitest";
import { MOCK_CANDIDATES } from "@/data/mock-candidates";
import { normalizaWhatsapp, parseContato, parseSimulacao } from "@/lib/apuracao/payload";
import { toPayload } from "@/lib/apuracao/enviar";
import { apurar, toCsv } from "@/lib/apuracao/apurar";
import type { Office, Vote } from "@/domain/voting/types";

const votosOk: Partial<Record<Office, Vote>> = {
  federal_deputy: { office: "federal_deputy", type: "candidate", candidateId: "sp-dep-fed-milton", number: "1055" },
  state_deputy: { office: "state_deputy", type: "blank" },
  senator_1: { office: "senator_1", type: "candidate", candidateId: "sp-sen-marina-silva", number: "181" },
  senator_2: { office: "senator_2", type: "candidate", candidateId: "sp-sen-guilherme-derrite", number: "111" },
  governor: { office: "governor", type: "null", number: "99" },
  president: { office: "president", type: "candidate", candidateId: "br-pres-lula", number: "13" },
};

describe("payload da simulação", () => {
  it("toPayload não leva o número digitado", () => {
    const p = toPayload("SP", votosOk);
    expect(JSON.stringify(p)).not.toContain("99");
    expect(p.votos).toHaveLength(6);
    expect(p.votos.find((v) => v.cargo === "governor")).toEqual({ cargo: "governor", tipo: "nulo", candidatoId: null });
  });
  it("aceita simulação completa e válida", () => {
    expect(parseSimulacao(toPayload("SP", votosOk), MOCK_CANDIDATES)).not.toBeNull();
  });
  it("senador vale nas duas vagas", () => {
    const v = { ...votosOk, senator_1: { office: "senator_1" as const, type: "candidate" as const, candidateId: "sp-sen-guilherme-derrite" }, senator_2: { office: "senator_2" as const, type: "candidate" as const, candidateId: "sp-sen-simone-tebet" } };
    expect(parseSimulacao(toPayload("SP", v), MOCK_CANDIDATES)).not.toBeNull();
  });
  it("rejeita simulação incompleta, cargo repetido, candidato inexistente ou no cargo errado", () => {
    const p = toPayload("SP", votosOk);
    expect(parseSimulacao({ ...p, votos: p.votos.slice(1) }, MOCK_CANDIDATES)).toBeNull();
    expect(parseSimulacao({ ...p, votos: [...p.votos.slice(1), p.votos[1]] }, MOCK_CANDIDATES)).toBeNull();
    const troca = (cargo: Office, candidatoId: string | null, tipo = "candidato") =>
      ({ ...p, votos: p.votos.map((v) => (v.cargo === cargo ? { cargo, tipo, candidatoId } : v)) });
    expect(parseSimulacao(troca("president", "nao-existe"), MOCK_CANDIDATES)).toBeNull();
    expect(parseSimulacao(troca("president", "sp-gov-haddad"), MOCK_CANDIDATES)).toBeNull();
    expect(parseSimulacao(troca("governor", "sp-gov-haddad", "nulo"), MOCK_CANDIDATES)).toBeNull();
    expect(parseSimulacao(troca("senator_2", "sp-sen-marina-silva"), MOCK_CANDIDATES)).toBeNull();
    expect(parseSimulacao({ ...p, estado: "RJ" }, MOCK_CANDIDATES)).toBeNull();
    expect(parseSimulacao("lixo", MOCK_CANDIDATES)).toBeNull();
  });
});

describe("contato", () => {
  it("normaliza WhatsApp brasileiro", () => {
    expect(normalizaWhatsapp("(11) 91234-5678")).toBe("5511912345678");
    expect(normalizaWhatsapp("+55 11 91234-5678")).toBe("5511912345678");
    expect(normalizaWhatsapp("11 3456-7890")).toBe("551134567890");
    expect(normalizaWhatsapp("91234-5678")).toBeNull();
    expect(normalizaWhatsapp("11111111111")).toBeNull();
    expect(normalizaWhatsapp("11 81234-5678")).toBeNull();
  });
  it("exige consentimento marcado", () => {
    expect(parseContato({ nome: "Ana", whatsapp: "11912345678", consentimento: true })).toEqual({ nome: "Ana", whatsapp: "5511912345678" });
    expect(parseContato({ nome: "Ana", whatsapp: "11912345678", consentimento: false })).toBeNull();
    expect(parseContato({ nome: "A", whatsapp: "11912345678", consentimento: true })).toBeNull();
  });
});

describe("apuração", () => {
  it("soma as duas vagas do Senado e calcula % dos válidos", () => {
    const r = apurar([
      { cargo: "senator_1", tipo: "candidato", candidatoId: "sp-sen-marina-silva", n: 3 },
      { cargo: "senator_2", tipo: "candidato", candidatoId: "sp-sen-marina-silva", n: 1 },
      { cargo: "senator_2", tipo: "candidato", candidatoId: "sp-sen-guilherme-derrite", n: 4 },
      { cargo: "senator_1", tipo: "branco", candidatoId: null, n: 2 },
      { cargo: "senator_2", tipo: "nulo", candidatoId: null, n: 1 },
    ], MOCK_CANDIDATES);
    const sen = r.find((x) => x.chave === "senator")!;
    expect(sen.validos).toBe(8);
    expect(sen.brancos).toBe(2);
    expect(sen.nulos).toBe(1);
    expect(sen.total).toBe(11);
    expect(sen.candidatos.map((c) => [c.nome, c.votos, c.pctValidos])).toEqual([
      ["GUILHERME DERRITE", 4, 50],
      ["MARINA SILVA", 4, 50],
    ]);
    expect(r.find((x) => x.chave === "president")!.total).toBe(0);
  });
  it("CSV neutraliza fórmula e escapa ;", () => {
    const csv = toCsv(["nome"], [["=HYPERLINK(1)"], ["a;b"]]);
    expect(csv).toContain("'=HYPERLINK(1)");
    expect(csv).toContain('"a;b"');
  });
});
