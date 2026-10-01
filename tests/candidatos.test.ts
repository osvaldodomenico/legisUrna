import { describe, it, expect } from "vitest";
import { CANDIDATOS } from "@/data/candidatos";
import { MOCK_CANDIDATES } from "@/data/mock-candidates";
import { lookupCandidate } from "@/domain/voting/machine";
import { FULL_OFFICES } from "@/domain/voting/rules";
import tse from "@/data/candidatos-sp.json";

const office = (k: string) => FULL_OFFICES.find((o) => o.key === k)!;

describe("CANDIDATOS (TSE)", () => {
  it("cobre os 5 cargos, com milhares de deputados", () => {
    const n = (o: string) => CANDIDATOS.filter((c) => c.office.startsWith(o)).length;
    expect(n("federal_deputy")).toBeGreaterThan(1000);
    expect(n("state_deputy")).toBeGreaterThan(1000);
    expect(n("senator")).toBeGreaterThan(5);
    expect(n("governor")).toBeGreaterThan(3);
    expect(n("president")).toBeGreaterThan(5);
  });

  it("os 11 da primeira versão mantêm id e foto (votos já gravados apontam para eles)", () => {
    for (const m of MOCK_CANDIDATES) {
      const c = CANDIDATOS.find((x) => x.id === m.id);
      expect(c, m.id).toBeDefined();
      expect(c!.number).toBe(m.number);
      expect(c!.photoUrl).toBe(m.photoUrl);
    }
  });

  it("um candidato por número em cada cargo", () => {
    const vistos = new Set<string>();
    for (const c of CANDIDATOS) {
      const k = `${c.office.startsWith("senator") ? "senator" : c.office}:${c.number}`;
      expect(vistos.has(k), k).toBe(false);
      vistos.add(k);
    }
  });

  it("a urna acha candidato novo pelo número", () => {
    const zema = lookupCandidate(CANDIDATOS, office("president"), "30", "SP");
    expect(zema?.ballotName).toBe("ZEMA");
    expect(lookupCandidate(CANDIDATOS, office("senator_2"), "180", "SP")?.id).toBe("sp-sen-marina-silva");
  });

  it("o JSON não carrega dado pessoal do TSE", () => {
    const chaves = new Set((tse as object[]).flatMap((l) => Object.keys(l)));
    expect([...chaves].sort()).toEqual(["cargo", "foto", "nome", "nrPartido", "numero", "partido", "sq", "uf"]);
  });
});
