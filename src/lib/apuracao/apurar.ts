import type { Candidate, Office } from "@/domain/voting/types";

/** Linha agregada do banco: quantos votos de um tipo (e candidato) num cargo. */
export interface ContagemVoto {
  cargo: Office;
  tipo: "candidato" | "branco" | "nulo";
  candidatoId: string | null;
  n: number;
}

export interface LinhaCandidato {
  candidatoId: string;
  nome: string;
  numero: string;
  partido: string;
  votos: number;
  /** % dos votos válidos, como a apuração oficial. */
  pctValidos: number;
}

export interface ResultadoCargo {
  chave: string;
  titulo: string;
  candidatos: LinhaCandidato[];
  validos: number;
  brancos: number;
  nulos: number;
  total: number;
}

// Senado soma as duas vagas, como no boletim de urna.
const GRUPOS: { chave: string; titulo: string; cargos: Office[] }[] = [
  { chave: "federal_deputy", titulo: "Deputado Federal", cargos: ["federal_deputy"] },
  { chave: "state_deputy", titulo: "Deputado Estadual", cargos: ["state_deputy"] },
  { chave: "senator", titulo: "Senador (2 vagas somadas)", cargos: ["senator_1", "senator_2"] },
  { chave: "governor", titulo: "Governador", cargos: ["governor"] },
  { chave: "president", titulo: "Presidente", cargos: ["president"] },
];

const pct = (parte: number, todo: number) => (todo === 0 ? 0 : Math.round((parte / todo) * 1000) / 10);

export function apurar(linhas: ContagemVoto[], candidates: Candidate[]): ResultadoCargo[] {
  return GRUPOS.map(({ chave, titulo, cargos }) => {
    const doGrupo = linhas.filter((l) => cargos.includes(l.cargo));
    const soma = (tipo: ContagemVoto["tipo"]) => doGrupo.filter((l) => l.tipo === tipo).reduce((a, l) => a + l.n, 0);
    const brancos = soma("branco");
    const nulos = soma("nulo");
    const validos = soma("candidato");

    const porCandidato = new Map<string, number>();
    for (const l of doGrupo) {
      if (l.tipo === "candidato" && l.candidatoId) {
        porCandidato.set(l.candidatoId, (porCandidato.get(l.candidatoId) ?? 0) + l.n);
      }
    }
    const candidatos = [...porCandidato.entries()]
      .map(([id, votos]) => {
        const c = candidates.find((x) => x.id === id);
        return {
          candidatoId: id,
          nome: c?.ballotName ?? id,
          numero: c?.number ?? "?",
          partido: c?.party.acronym ?? "?",
          votos,
          pctValidos: pct(votos, validos),
        };
      })
      .sort((a, b) => b.votos - a.votos || a.nome.localeCompare(b.nome));

    return { chave, titulo, candidatos, validos, brancos, nulos, total: validos + brancos + nulos };
  });
}

/** CSV com ; (abre direto no Excel pt-BR). Campo começando com = + - @ vira texto para não virar fórmula. */
export function toCsv(cabecalho: string[], linhas: (string | null)[][]): string {
  const cel = (v: string | null) => {
    let s = v ?? "";
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [cabecalho, ...linhas].map((l) => l.map(cel).join(";")).join("\r\n") + "\r\n";
}
