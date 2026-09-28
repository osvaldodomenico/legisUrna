import { describe, it, expect } from "vitest";
import { toScreenView, runningMateLabel, runningMateShort } from "@/components/urna/screen-view";
import { FULL_OFFICES } from "@/domain/voting/rules";
import type { Candidate } from "@/domain/voting/types";

const gov = FULL_OFFICES.find((o) => o.key === "governor")!;
const cand: Candidate = {
  id: "x", office: "governor", number: "10", ballotName: "X", fullName: "X",
  party: { number: 10, acronym: "P", name: "P" }, photoUrl: "", stateCode: "SP", runningMates: [],
};
const base = { started: true, stateName: "São Paulo", office: gov, digits: "", foundCandidate: null as Candidate | null };

describe("toScreenView", () => {
  it("idle antes de iniciar, independente do status", () => {
    expect(toScreenView({ ...base, started: false, status: "TYPING" })).toEqual({ kind: "idle", stateName: "São Paulo" });
  });
  it("typing em READY/TYPING", () => {
    expect(toScreenView({ ...base, status: "READY" })).toEqual({ kind: "typing", office: gov, digits: "" });
    expect(toScreenView({ ...base, status: "TYPING", digits: "1" })).toEqual({ kind: "typing", office: gov, digits: "1" });
  });
  it("candidate quando encontrado", () => {
    expect(toScreenView({ ...base, status: "CANDIDATE_FOUND", digits: "10", foundCandidate: cand }))
      .toEqual({ kind: "candidate", office: gov, digits: "10", candidate: cand });
  });
  it("null em CONFIRM_READY e invalid em INVALID_NUMBER", () => {
    expect(toScreenView({ ...base, status: "CONFIRM_READY", digits: "99" })).toEqual({ kind: "null", office: gov, digits: "99" });
    expect(toScreenView({ ...base, status: "INVALID_NUMBER", digits: "99" })).toEqual({ kind: "invalid", office: gov, digits: "99" });
  });
  it("blank em BLANK_PENDING", () => {
    expect(toScreenView({ ...base, status: "BLANK_PENDING" })).toEqual({ kind: "blank", office: gov });
  });
  it("finished em FINISHED ou sem cargo", () => {
    expect(toScreenView({ ...base, status: "FINISHED" })).toEqual({ kind: "finished" });
    expect(toScreenView({ ...base, status: "TYPING", office: null })).toEqual({ kind: "finished" });
  });
});

describe("runningMateLabel", () => {
  it("rótulos por cargo e papel", () => {
    expect(runningMateLabel("governor", "vice")).toBe("Vice-Governador");
    expect(runningMateLabel("president", "vice")).toBe("Vice-Presidente");
    expect(runningMateLabel("senator_1", "first_alternate")).toBe("1º Suplente");
    expect(runningMateLabel("senator_2", "second_alternate")).toBe("2º Suplente");
    expect(runningMateLabel("federal_deputy", "vice")).toBeNull();
    expect(runningMateLabel("governor", "first_alternate")).toBeNull();
  });
  it("legenda curta das fotos", () => {
    expect(runningMateShort("vice")).toBe("Vice");
    expect(runningMateShort("first_alternate")).toBe("1º Sup.");
    expect(runningMateShort("second_alternate")).toBe("2º Sup.");
  });
});
