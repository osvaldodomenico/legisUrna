import type { Candidate, Party } from "@/domain/voting/types";

const party = (number: number, acronym: string, name: string): Party => ({ number, acronym, name });

const REP = party(10, "REPUBLICANOS", "Republicanos");
const PP = party(11, "PP", "Progressistas");
const PL = party(22, "PL", "Partido Liberal");

const mk = (
  id: string,
  office: Candidate["office"],
  number: string,
  ballotName: string,
  fullName: string,
  p: Party,
  stateCode: string | null,
  photo: string
): Candidate => ({
  id,
  office,
  number,
  ballotName,
  fullName,
  party: p,
  photoUrl: `/candidates/${photo}`,
  stateCode,
  runningMates: [],
});

// Chapa SP 2026 — ordem oficial TSE (6 cargos). Fotos recortadas (CPF/CNPJ removidos).
// Números confirmados por Domenico: Milton 1055, Rui Alves 10111, Tarcísio 10, Derrite 111, Flávio 22.
// André do Prado (2ª vaga senado) incluído com
// número provisório — confirmar oficial antes do TSE.
export const MOCK_CANDIDATES: Candidate[] = [
  mk("sp-dep-fed-milton", "federal_deputy", "1055", "MILTON VIEIRA", "Milton Vieira", REP, "SP", "sp-dep-fed-milton.png"),
  mk("sp-dep-est-rui-alves", "state_deputy", "10111", "RUI ALVES", "Rui Alves", REP, "SP", "sp-dep-est-rui-alves.png"),
  mk("sp-sen-guilherme-derrite", "senator_1", "111", "GUILHERME DERRITE", "Guilherme Derrite", PP, "SP", "sp-sen-guilherme-derrite.png"),
  mk("sp-sen-andre-do-prado", "senator_2", "222", "ANDRE DO PRADO", "André do Prado", PL, "SP", "sp-sen-andre-do-prado.png"),
  mk("sp-gov-tarcisio", "governor", "10", "TARCISIO DE FREITAS", "Tarcisio de Freitas", REP, "SP", "sp-gov-tarcisio.png"),
  mk("br-pres-flavio-bolsonaro", "president", "22", "FLAVIO BOLSONARO", "Flavio Bolsonaro", PL, null, "br-pres-flavio-bolsonaro.png"),
];
