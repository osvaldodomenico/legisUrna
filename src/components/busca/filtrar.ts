import type { Candidate, Office } from "@/domain/voting/types";

const LIMITE = 40;

/** Maiúsculas e sem acento, para "tarcisio" achar "TARCÍSIO". */
export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
}

const mesmoCargo = (c: Office, alvo: Office) =>
  c === alvo || (c.startsWith("senator") && alvo.startsWith("senator"));

/** Candidatos do cargo cujo nome de urna, partido ou número batem com o termo.
 *  Número exato primeiro, depois nome que começa pelo termo, depois o resto em ordem alfabética. */
export function filtrarCandidatos(candidates: Candidate[], office: Office, termo: string): Candidate[] {
  const t = normalizar(termo);
  const doCargo = candidates.filter((c) => mesmoCargo(c.office, office));
  if (!t) return doCargo.slice().sort((a, b) => a.ballotName.localeCompare(b.ballotName)).slice(0, LIMITE);
  const peso = (c: Candidate) => {
    const nome = normalizar(c.ballotName);
    if (c.number === t) return 0;
    if (nome.startsWith(t)) return 1;
    if (c.number.startsWith(t)) return 2;
    if (nome.includes(t)) return 3;
    if (normalizar(c.party.acronym) === t) return 4;
    return -1;
  };
  return doCargo
    .map((c) => ({ c, p: peso(c) }))
    .filter((x) => x.p >= 0)
    .sort((a, b) => a.p - b.p || a.c.ballotName.localeCompare(b.c.ballotName))
    .slice(0, LIMITE)
    .map((x) => x.c);
}
