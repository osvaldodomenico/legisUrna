import { describe, it, expect } from "vitest";
import { filtrarCandidatos, normalizar } from "@/components/busca/filtrar";
import { CANDIDATOS } from "@/data/candidatos";

describe("filtrarCandidatos", () => {
  it("acha sem acento e só no cargo da vez", () => {
    const r = filtrarCandidatos(CANDIDATOS, "governor", "tarcisio");
    expect(r[0]?.id).toBe("sp-gov-tarcisio");
    expect(filtrarCandidatos(CANDIDATOS, "president", "tarcisio")).toEqual([]);
  });

  it("senador aparece nas duas vagas", () => {
    expect(filtrarCandidatos(CANDIDATOS, "senator_2", "marina")[0]?.id).toBe("sp-sen-marina-silva");
    expect(filtrarCandidatos(CANDIDATOS, "senator_1", "andre do prado")[0]?.id).toBe("sp-sen-andre-do-prado");
  });

  it("número exato vem primeiro", () => {
    expect(filtrarCandidatos(CANDIDATOS, "federal_deputy", "1055")[0]?.id).toBe("sp-dep-fed-milton");
  });

  it("termo vazio lista o cargo em ordem alfabética, com limite", () => {
    const r = filtrarCandidatos(CANDIDATOS, "state_deputy", "");
    expect(r.length).toBe(40);
    expect(normalizar(r[0].ballotName) <= normalizar(r[1].ballotName)).toBe(true);
  });
});
