import type { Candidate, Office, OfficeConfig, Vote } from "@/domain/voting/types";

export interface LinhaColinha {
  cargo: string;
  /** Dígitos a levar para a urna; vazio no voto em branco. */
  numero: string;
  tipo: Vote["type"];
  nome: string | null;
  partido: string | null;
  foto: string | null;
}

/** Uma linha por cargo, na ordem da urna, a partir dos votos já confirmados. Função pura. */
export function montarColinha(
  offices: OfficeConfig[],
  votes: Partial<Record<Office, Vote>>,
  candidates: Candidate[]
): LinhaColinha[] {
  return offices.flatMap((o) => {
    const v = votes[o.key];
    if (!v) return [];
    const c = v.type === "candidate" ? candidates.find((x) => x.id === v.candidateId) ?? null : null;
    return [{
      cargo: o.label,
      numero: v.type === "blank" ? "" : v.number ?? c?.number ?? "",
      tipo: v.type,
      nome: c?.ballotName ?? null,
      partido: c?.party.acronym ?? null,
      foto: c?.photoUrl ?? null,
    }];
  });
}
