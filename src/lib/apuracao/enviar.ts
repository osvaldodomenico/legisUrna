import type { Office, Vote } from "@/domain/voting/types";
import type { SimulacaoGravavel, VotoGravavel } from "./payload";

const TIPO: Record<Vote["type"], VotoGravavel["tipo"]> = { candidate: "candidato", blank: "branco", null: "nulo" };

/** Converte os votos do store no corpo do POST. Não leva número digitado nem nada da pessoa. */
export function toPayload(estado: string, votes: Partial<Record<Office, Vote>>): SimulacaoGravavel {
  return {
    estado,
    votos: Object.values(votes).flatMap((v) =>
      v ? [{ cargo: v.office, tipo: TIPO[v.type], candidatoId: v.type === "candidate" ? v.candidateId ?? null : null }] : []
    ),
  };
}

/** Manda a simulação concluída para a apuração. Silencioso: falha de rede não atrapalha a urna. */
export function enviarSimulacao(estado: string, votes: Partial<Record<Office, Vote>>): void {
  fetch("/api/simulacoes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toPayload(estado, votes)),
    keepalive: true,
  }).catch(() => {});
}
