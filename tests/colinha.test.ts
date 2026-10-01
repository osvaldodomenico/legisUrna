import { describe, it, expect } from "vitest";
import { montarColinha, textoWhatsapp } from "@/components/colinha/linhas";
import { FULL_OFFICES } from "@/domain/voting/rules";
import { rotuloCurto } from "@/components/colinha/desenhar";
import { MOCK_CANDIDATES } from "@/data/mock-candidates";
import type { Office, Vote } from "@/domain/voting/types";

describe("montarColinha", () => {
  it("uma linha por cargo, na ordem da urna, com branco e nulo", () => {
    const votes: Partial<Record<Office, Vote>> = {
      president: { office: "president", type: "candidate", candidateId: "br-pres-lula", number: "13" },
      federal_deputy: { office: "federal_deputy", type: "candidate", candidateId: "sp-dep-fed-milton", number: "1055" },
      state_deputy: { office: "state_deputy", type: "blank" },
      senator_1: { office: "senator_1", type: "null", number: "999" },
      senator_2: { office: "senator_2", type: "candidate", candidateId: "sp-sen-andre-do-prado", number: "222" },
      governor: { office: "governor", type: "candidate", candidateId: "sp-gov-tarcisio", number: "10" },
    };
    const linhas = montarColinha(FULL_OFFICES, votes, MOCK_CANDIDATES);
    expect(linhas.map((l) => l.cargo)).toEqual(FULL_OFFICES.map((o) => o.label));
    expect(linhas[0]).toEqual({
      cargo: "Deputado Federal", numero: "1055", tipo: "candidate",
      nome: "MILTON VIEIRA", partido: "REPUBLICANOS", foto: "/candidates/sp-dep-fed-milton.webp",
    });
    expect(linhas[1]).toMatchObject({ tipo: "blank", numero: "", nome: null, foto: null });
    expect(linhas[2]).toMatchObject({ tipo: "null", numero: "999", nome: null });
    expect(linhas[5]).toMatchObject({ numero: "13", nome: "LULA", partido: "PT" });
  });

  it("ignora cargo ainda sem voto", () => {
    expect(montarColinha(FULL_OFFICES, {}, MOCK_CANDIDATES)).toEqual([]);
  });
});

describe("textoWhatsapp", () => {
  it("colinha em texto, com branco, nulo e o link do simulador", () => {
    const t = textoWhatsapp([
      { cargo: "Deputado Federal", numero: "1055", tipo: "candidate", nome: "MILTON VIEIRA", partido: "REPUBLICANOS", foto: null },
      { cargo: "Deputado Estadual ou Distrital", numero: "", tipo: "blank", nome: null, partido: null, foto: null },
      { cargo: "Senador — 2ª vaga", numero: "999", tipo: "null", nome: null, partido: null, foto: null },
    ], "https://simulador.shiftlegis.com.br");
    expect(t).toBe([
      "Minha colinha para 2026 (simulação não oficial):", "",
      "Deputado Federal: 1055 - MILTON VIEIRA",
      "Deputado Estadual ou Distrital: BRANCO",
      "Senador — 2ª vaga: 999 (nulo)", "",
      "Faça a sua: https://simulador.shiftlegis.com.br",
    ].join("\n"));
  });
});

describe("rotuloCurto", () => {
  it("encurta os cargos para a imagem", () => {
    expect(FULL_OFFICES.map((o) => rotuloCurto(o.label))).toEqual([
      "DEPUTADO FEDERAL", "DEPUTADO ESTADUAL", "1º SENADOR", "2º SENADOR", "GOVERNADOR", "PRESIDENTE",
    ]);
  });
});
