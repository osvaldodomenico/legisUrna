export type Office =
  | "senator_1"
  | "senator_2"
  | "governor"
  | "president"
  | "federal_deputy"
  | "state_deputy";

export interface OfficeConfig {
  key: Office;
  label: string;
  digits: number;
  order: number;
  enabled: boolean;
}

export interface Party {
  number: number;
  acronym: string;
  name: string;
}

export interface RunningMate {
  role: "vice" | "first_alternate" | "second_alternate";
  ballotName: string;
  fullName?: string;
  photoUrl?: string;
  order?: number;
}

export interface Candidate {
  id: string;
  office: Office;
  number: string;
  ballotName: string;
  fullName: string;
  party: Party;
  photoUrl: string;
  stateCode?: string | null;
  runningMates: RunningMate[];
}

export type VoteType = "candidate" | "blank" | "null";

export interface Vote {
  office: Office;
  type: VoteType;
  candidateId?: string;
  number?: string;
}

export type VotingStatus =
  | "READY"
  | "TYPING"
  | "CANDIDATE_FOUND"
  | "INVALID_NUMBER"
  | "BLANK_PENDING"
  | "CONFIRM_READY"
  | "FINISHED";

export interface VotingSessionState {
  offices: OfficeConfig[];
  currentIndex: number;
  digits: string;
  status: VotingStatus;
  foundCandidate: Candidate | null;
  votes: Partial<Record<Office, Vote>>;
  senator1CandidateId: string | null;
  enableNull: boolean;
}
