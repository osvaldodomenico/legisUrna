import { describe, it, expect } from "vitest";
import { MAJORITARIAN_OFFICES, currentOffice, isSecondSenatorDuplicate, nextOfficeIndex } from "@/domain/voting/rules";
import { buildVote, canConfirmState, deriveStatus, lookupCandidate } from "@/domain/voting/machine";
import type { Candidate } from "@/domain/voting/types";
import { MOCK_CANDIDATES } from "@/data/mock-candidates";

const P = { number: 1, acronym: "T", name: "T" };
const mk = (id: string, office: Candidate["office"], number: string, stateCode: string | null): Candidate => ({
  id, office, number, ballotName: id.toUpperCase(), fullName: id, party: P,
  photoUrl: "", stateCode, runningMates: [],
});

describe("dígitos por cargo", () => {
  it("senador 3, governador 2, presidente 2", () => {
    expect(MAJORITARIAN_OFFICES.map((o) => o.digits)).toEqual([3, 3, 2, 2]);
    expect(MAJORITARIAN_OFFICES.map((o) => o.key)).toEqual(["senator_1", "senator_2", "governor", "president"]);
  });
  it("ordem de votação é a oficial majoritária", () => {
    expect(MAJORITARIAN_OFFICES.map((o) => o.order)).toEqual([1, 2, 3, 4]);
  });
});

describe("lookupCandidate", () => {
  const gov = currentOffice(MAJORITARIAN_OFFICES, 2)!;
  const pres = currentOffice(MAJORITARIAN_OFFICES, 3)!;
  const sen = currentOffice(MAJORITARIAN_OFFICES, 0)!;

  it("só encontra com número completo", () => {
    expect(lookupCandidate(MOCK_CANDIDATES, gov, "1", "SP")).toBeNull();
  });
  it("encontra governador do estado correto", () => {
    expect(lookupCandidate(MOCK_CANDIDATES, gov, "10", "SP")?.id).toBe("sp-gov-tarcisio");
  });
  it("não acha candidato de outro estado", () => {
    expect(lookupCandidate(MOCK_CANDIDATES, gov, "10", "RJ")).toBeNull();
  });
  it("presidente é nacional (independe do estado)", () => {
    const cands = [mk("p1", "president", "88", null)];
    expect(lookupCandidate(cands, pres, "88", "SP")?.id).toBe("p1");
    expect(lookupCandidate(cands, pres, "88", "RS")?.id).toBe("p1");
  });
  it("candidato de senador atende ambas as vagas", () => {
    const cands = [mk("s1", "senator_1", "111", "SP")];
    expect(lookupCandidate(cands, sen, "111", "SP")?.id).toBe("s1");
  });
});

describe("anti-repetição Senado 2ª vaga", () => {
  it("bloqueia o mesmo candidate.id da 1ª vaga", () => {
    expect(isSecondSenatorDuplicate("a", "a")).toBe(true);
    expect(isSecondSenatorDuplicate("b", "a")).toBe(false);
    expect(isSecondSenatorDuplicate("a", null)).toBe(false);
  });
  it("confirm() rejeita e apresenta motivo", () => {
    const sen2 = currentOffice(MAJORITARIAN_OFFICES, 1)!;
    const c = mk("a", "senator_1", "111", "SP");
    const r = canConfirmState({ status: "CANDIDATE_FOUND", digits: "111", office: sen2, foundCandidate: c, senator1CandidateId: "a", enableNull: true });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/diferente/);
  });
});

describe("estados e confirmação", () => {
  const gov = currentOffice(MAJORITARIAN_OFFICES, 2)!;
  const c = mk("g", "governor", "13", "SP");

  it("TYPING enquanto incompleto", () => {
    expect(deriveStatus({ digits: "1", office: gov, foundCandidate: null, blankPending: false, enableNull: true })).toBe("TYPING");
  });
  it("CANDIDATE_FOUND com candidato válido", () => {
    expect(deriveStatus({ digits: "13", office: gov, foundCandidate: c, blankPending: false, enableNull: true })).toBe("CANDIDATE_FOUND");
  });
  it("INVALID_NUMBER quando voto anulado desativado", () => {
    expect(deriveStatus({ digits: "99", office: gov, foundCandidate: null, blankPending: false, enableNull: false })).toBe("INVALID_NUMBER");
  });
  it("CONFIRM_READY para número não cadastrado quando anulado habilitado", () => {
    expect(deriveStatus({ digits: "99", office: gov, foundCandidate: null, blankPending: false, enableNull: true })).toBe("CONFIRM_READY");
  });
  it("BLANK_PENDING tem prioridade", () => {
    expect(deriveStatus({ digits: "", office: gov, foundCandidate: c, blankPending: true, enableNull: true })).toBe("BLANK_PENDING");
  });
  it("não confirma com estado INVALID_NUMBER", () => {
    expect(canConfirmState({ status: "INVALID_NUMBER", digits: "99", office: gov, foundCandidate: null, senator1CandidateId: null, enableNull: false }).ok).toBe(false);
  });
  it("confirma branco", () => {
    expect(canConfirmState({ status: "BLANK_PENDING", digits: "", office: gov, foundCandidate: null, senator1CandidateId: null, enableNull: true }).ok).toBe(true);
  });
  it("não confirma em branco no meio da digitação", () => {
    expect(canConfirmState({ status: "TYPING", digits: "1", office: gov, foundCandidate: null, senator1CandidateId: null, enableNull: true }).ok).toBe(false);
  });
  it("FINISHED quando não há cargo", () => {
    expect(deriveStatus({ digits: "", office: null, foundCandidate: null, blankPending: false, enableNull: true })).toBe("FINISHED");
  });
});

describe("buildVote", () => {
  const gov = currentOffice(MAJORITARIAN_OFFICES, 2)!;
  it("branco", () => expect(buildVote({ office: gov, status: "BLANK_PENDING", digits: "", foundCandidate: null })).toEqual({ office: "governor", type: "blank" }));
  it("candidato", () => expect(buildVote({ office: gov, status: "CANDIDATE_FOUND", digits: "13", foundCandidate: mk("g", "governor", "13", "SP") }).type).toBe("candidate"));
  it("nulo", () => expect(buildVote({ office: gov, status: "CONFIRM_READY", digits: "99", foundCandidate: null })).toEqual({ office: "governor", type: "null", number: "99" }));
});

describe("navegação de etapas", () => {
  it("4 etapas majoritárias e fim na última", () => {
    expect(nextOfficeIndex(MAJORITARIAN_OFFICES, 0)).toBe(1);
    expect(nextOfficeIndex(MAJORITARIAN_OFFICES, 2)).toBe(3);
    expect(nextOfficeIndex(MAJORITARIAN_OFFICES, 3)).toBeNull();
  });
});

describe("aviso não oficial", () => {
  it("constante presente e inequívoca", async () => {
    const { DISCLAIMER_TEXT } = await import("@/components/ui/Disclaimer");
    expect(DISCLAIMER_TEXT).toMatch(/SIMULAÇÃO NÃO OFICIAL/);
    expect(DISCLAIMER_TEXT).toMatch(/não é operado pelo TSE/);
  });
});
