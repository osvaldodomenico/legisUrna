"use client";

import { create } from "zustand";
import type { Candidate, Office, OfficeConfig, Vote, VotingStatus } from "@/domain/voting/types";
import { FULL_OFFICES, currentOffice, nextOfficeIndex } from "@/domain/voting/rules";
import { buildVote, canConfirmState, deriveStatus, lookupCandidate } from "@/domain/voting/machine";

interface VotingSession {
  stateCode: string;
  offices: OfficeConfig[];
  candidates: Candidate[];
  enableNull: boolean;
  currentIndex: number;
  digits: string;
  blankPending: boolean;
  status: VotingStatus;
  foundCandidate: Candidate | null;
  votes: Partial<Record<Office, Vote>>;
  message: string | null;
}

interface Actions {
  init: (stateCode: string, candidates: Candidate[], offices?: OfficeConfig[], enableNull?: boolean) => void;
  pressDigit: (d: string) => void;
  backspace: () => void;
  pressBlank: () => void;
  pressCorrect: () => void;
  confirm: () => "ok" | "blocked";
  restart: () => void;
  getOffice: () => OfficeConfig | null;
  isConfirmEnabled: () => boolean;
}

type Store = VotingSession & Actions;

const initial = (): VotingSession => ({
  stateCode: "SP",
  offices: FULL_OFFICES,
  candidates: [],
  enableNull: true,
  currentIndex: 0,
  digits: "",
  blankPending: false,
  status: "READY",
  foundCandidate: null,
  votes: {},
  message: null,
});

function recompute(s: VotingSession): Pick<VotingSession, "status" | "foundCandidate"> {
  const office = currentOffice(s.offices, s.currentIndex);
  const found = office ? lookupCandidate(s.candidates, office, s.digits, s.stateCode) : null;
  const status = deriveStatus({
    digits: s.digits,
    office,
    foundCandidate: found,
    blankPending: s.blankPending,
    enableNull: s.enableNull,
  });
  return { status, foundCandidate: found };
}

export const useVotingSession = create<Store>()((set, get) => ({
  ...initial(),

  init: (stateCode, candidates, offices, enableNull) => {
    set({
      ...initial(),
      stateCode,
      candidates,
      offices: offices ?? FULL_OFFICES,
      enableNull: enableNull ?? true,
      status: "TYPING",
    });
  },

  pressDigit: (d) => {
    const s = get();
    if (s.blankPending) return;
    if (s.status === "CANDIDATE_FOUND" || s.status === "CONFIRM_READY") return; // exige CORRIGE
    const office = currentOffice(s.offices, s.currentIndex);
    if (!office || s.digits.length >= office.digits) return;
    const digits = s.digits + d;
    set({ digits, ...recompute({ ...s, digits }) });
  },

  backspace: () => {
    const s = get();
    if (s.blankPending) {
      set({ blankPending: false, message: null, ...recompute({ ...s, blankPending: false }) });
      return;
    }
    if (!s.digits) return;
    const digits = s.digits.slice(0, -1);
    set({ digits, message: null, ...recompute({ ...s, digits }) });
  },

  pressBlank: () => {
    const s = get();
    if (s.status === "CANDIDATE_FOUND" || s.status === "CONFIRM_READY") return;
    set({ blankPending: true, message: null, ...recompute({ ...s, blankPending: true }) });
  },

  pressCorrect: () => {
    const s = get();
    set({ digits: "", blankPending: false, message: null, ...recompute({ ...s, digits: "", blankPending: false }) });
  },

  confirm: () => {
    const s = get();
    const office = currentOffice(s.offices, s.currentIndex);
    if (!office) return "blocked";
    const check = canConfirmState({
      status: s.status,
      digits: s.digits,
      office,
      foundCandidate: s.foundCandidate,
      senator1CandidateId: s.votes.senator_1?.candidateId ?? null,
      enableNull: s.enableNull,
    });
    if (!check.ok) {
      set({ message: check.reason ?? null });
      return "blocked";
    }
    const vote = buildVote({ office, status: s.status, digits: s.digits, foundCandidate: s.foundCandidate });
    const votes = { ...s.votes, [office.key]: vote };
    const next = nextOfficeIndex(s.offices, s.currentIndex);
    if (next === null) {
      set({ votes, status: "FINISHED", digits: "", blankPending: false, foundCandidate: null, message: null });
      return "ok";
    }
    const adv = { ...s, votes, currentIndex: next, digits: "", blankPending: false };
    set({ votes, currentIndex: next, digits: "", blankPending: false, message: null, ...recompute(adv) });
    return "ok";
  },

  restart: () => set({ ...initial(), stateCode: get().stateCode, offices: get().offices, candidates: get().candidates, enableNull: get().enableNull, status: "TYPING" }),

  getOffice: () => currentOffice(get().offices, get().currentIndex),

  isConfirmEnabled: () => {
    const s = get();
    const office = currentOffice(s.offices, s.currentIndex);
    if (!office) return false;
    return canConfirmState({
      status: s.status,
      digits: s.digits,
      office,
      foundCandidate: s.foundCandidate,
      senator1CandidateId: s.votes.senator_1?.candidateId ?? null,
      enableNull: s.enableNull,
    }).ok;
  },
}));
