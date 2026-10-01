import type { Candidate, Office } from "@/domain/voting/types";
import { MOCK_CANDIDATES } from "./mock-candidates";
import tse from "./candidatos-sp.json";

interface LinhaTse {
  sq: string;
  cargo: string;
  numero: string;
  nome: string;
  partido: string;
  nrPartido: number;
  uf: string | null;
  foto: boolean;
}

const chave = (office: Office, numero: string) =>
  `${office.startsWith("senator") ? "senator" : office}:${numero}`;

// Os 11 candidatos da primeira versão mantêm o id (os votos já gravados apontam para ele)
// e a foto maior que o Domenico enviou. Nome e partido vêm do TSE, como para os demais.
const ANTIGOS = new Map(MOCK_CANDIDATES.map((c) => [chave(c.office, c.number), c]));

/** Candidatos de SP + Presidente, dos dados abertos do TSE (`pnpm importar:candidatos`). */
export const CANDIDATOS: Candidate[] = (tse as LinhaTse[]).map((l) => {
  const office = l.cargo as Office;
  const antigo = ANTIGOS.get(chave(office, l.numero));
  return {
    id: antigo?.id ?? `tse-${l.sq}`,
    office: antigo?.office ?? office,
    number: l.numero,
    ballotName: l.nome,
    fullName: l.nome,
    party: { number: l.nrPartido, acronym: l.partido, name: l.partido },
    photoUrl: antigo?.photoUrl ?? (l.foto ? `/candidates/tse/${l.sq}.webp` : ""),
    stateCode: l.uf,
    runningMates: [],
  };
});
