import type { Candidate, Office, OfficeConfig, RunningMate, VotingStatus } from "@/domain/voting/types";

/** O que a tela da urna mostra. Derivado do store + estado local `started`; sem React. */
export type ScreenView =
  | { kind: "idle"; stateName: string | null }
  | { kind: "typing"; office: OfficeConfig; digits: string }
  | { kind: "candidate"; office: OfficeConfig; digits: string; candidate: Candidate }
  | { kind: "null"; office: OfficeConfig; digits: string }
  | { kind: "invalid"; office: OfficeConfig; digits: string }
  | { kind: "blank"; office: OfficeConfig }
  | { kind: "finished" };

export function toScreenView(input: {
  started: boolean;
  stateName: string | null;
  status: VotingStatus;
  office: OfficeConfig | null;
  digits: string;
  foundCandidate: Candidate | null;
}): ScreenView {
  if (!input.started) return { kind: "idle", stateName: input.stateName };
  if (input.status === "FINISHED" || !input.office) return { kind: "finished" };
  const { office, digits } = input;
  switch (input.status) {
    case "BLANK_PENDING":
      return { kind: "blank", office };
    case "CANDIDATE_FOUND":
      return input.foundCandidate
        ? { kind: "candidate", office, digits, candidate: input.foundCandidate }
        : { kind: "typing", office, digits };
    case "CONFIRM_READY":
      return { kind: "null", office, digits };
    case "INVALID_NUMBER":
      return { kind: "invalid", office, digits };
    default:
      return { kind: "typing", office, digits };
  }
}

/** Rótulo da linha de texto do vice/suplente na tela, ou null quando o cargo não tem. */
export function runningMateLabel(office: Office, role: RunningMate["role"]): string | null {
  if (role === "vice") {
    if (office === "governor") return "Vice-Governador";
    if (office === "president") return "Vice-Presidente";
    return null;
  }
  if (office === "senator_1" || office === "senator_2") {
    return role === "first_alternate" ? "1º Suplente" : "2º Suplente";
  }
  return null;
}

/** Legenda curta sob a foto pequena. */
export function runningMateShort(role: RunningMate["role"]): string {
  if (role === "vice") return "Vice";
  return role === "first_alternate" ? "1º Sup." : "2º Sup.";
}
