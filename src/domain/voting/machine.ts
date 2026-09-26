import type { Candidate, Office, OfficeConfig, Vote, VotingStatus } from "./types";
import { isSecondSenatorDuplicate } from "./rules";

/** Um candidato atende um cargo se for o próprio cargo, ou qualquer vaga do Senado. */
function servesOffice(candidateOffice: Office, target: Office): boolean {
  if (candidateOffice === target) return true;
  return target.startsWith("senator") && candidateOffice.startsWith("senator");
}

export function lookupCandidate(
  candidates: Candidate[],
  office: OfficeConfig,
  digits: string,
  stateCode: string
): Candidate | null {
  if (digits.length !== office.digits) return null;
  const national = office.key === "president";
  return (
    candidates.find(
      (c) =>
        c.number === digits &&
        servesOffice(c.office, office.key) &&
        (national || !c.stateCode || c.stateCode === stateCode)
    ) ?? null
  );
}

export function deriveStatus(input: {
  digits: string;
  office: OfficeConfig | null;
  foundCandidate: Candidate | null;
  blankPending: boolean;
  enableNull: boolean;
}): VotingStatus {
  if (!input.office) return "FINISHED";
  if (input.blankPending) return "BLANK_PENDING";
  if (input.digits.length < input.office.digits) return "TYPING";
  if (input.foundCandidate) return "CANDIDATE_FOUND";
  return input.enableNull ? "CONFIRM_READY" : "INVALID_NUMBER";
}

export function canConfirmState(args: {
  status: VotingStatus;
  digits: string;
  office: OfficeConfig | null;
  foundCandidate: Candidate | null;
  senator1CandidateId: string | null;
  enableNull: boolean;
}): { ok: boolean; reason?: string } {
  if (args.status === "BLANK_PENDING") return { ok: true };
  if (args.status === "CANDIDATE_FOUND" && args.foundCandidate) {
    if (
      args.office?.key === "senator_2" &&
      isSecondSenatorDuplicate(args.foundCandidate.id, args.senator1CandidateId)
    ) {
      return { ok: false, reason: "Para a segunda vaga ao Senado, escolha uma candidatura diferente." };
    }
    return { ok: true };
  }
  if (
    args.status === "CONFIRM_READY" &&
    args.enableNull &&
    args.office &&
    args.digits.length === args.office.digits
  ) {
    return { ok: true };
  }
  return { ok: false };
}

export function buildVote(args: {
  office: OfficeConfig;
  status: VotingStatus;
  digits: string;
  foundCandidate: Candidate | null;
}): Vote {
  if (args.status === "BLANK_PENDING") return { office: args.office.key, type: "blank" };
  if (args.foundCandidate) {
    return { office: args.office.key, type: "candidate", candidateId: args.foundCandidate.id, number: args.digits };
  }
  return { office: args.office.key, type: "null", number: args.digits };
}
