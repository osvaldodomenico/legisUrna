import type { Candidate, Party } from "@/domain/voting/types";

const party = (number: number, acronym: string, name: string): Party => ({ number, acronym, name });

const REP = party(10, "REPUBLICANOS", "Republicanos");
const PP = party(11, "PP", "Progressistas");
const PL = party(22, "PL", "Partido Liberal");
const PT = party(13, "PT", "Partido dos Trabalhadores");
const MDB = party(15, "MDB", "Movimento Democrático Brasileiro");
const REDE = party(18, "REDE", "Rede Sustentabilidade");

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
  mk("sp-dep-fed-milton", "federal_deputy", "1055", "MILTON VIEIRA", "Milton Vieira", REP, "SP", "sp-dep-fed-milton.jpg"),
  mk("sp-dep-est-rui-alves", "state_deputy", "10111", "RUI ALVES", "Rui Alves", REP, "SP", "sp-dep-est-rui-alves.jpg"),
  mk("sp-sen-guilherme-derrite", "senator_1", "111", "GUILHERME DERRITE", "Guilherme Derrite", PP, "SP", "sp-sen-guilherme-derrite.jpg"),
  mk("sp-sen-andre-do-prado", "senator_2", "222", "ANDRE DO PRADO", "André do Prado", PL, "SP", "sp-sen-andre-do-prado.jpg"),
  mk("sp-gov-tarcisio", "governor", "10", "TARCISIO DE FREITAS", "Tarcisio de Freitas", REP, "SP", "sp-gov-tarcisio.jpg"),
  mk("br-pres-flavio-bolsonaro", "president", "22", "FLAVIO BOLSONARO", "Flavio Bolsonaro", PL, null, "br-pres-flavio-bolsonaro.jpg"),
  // Lote 2 (2026-09-28). Gilmaci: número de 2022. Marina 181 e Tebet 151 são PROVISÓRIOS
  // (padrão partido + 1) — confirmar o oficial. Fotos chegam depois; sem arquivo a foto só não aparece.
  mk("sp-dep-est-gilmaci", "state_deputy", "10123", "GILMACI SANTOS", "Gilmaci Santos", REP, "SP", "sp-dep-est-gilmaci.jpg"),
  mk("sp-sen-marina-silva", "senator_1", "181", "MARINA SILVA", "Marina Silva", REDE, "SP", "sp-sen-marina-silva.jpg"),
  mk("sp-sen-simone-tebet", "senator_1", "151", "SIMONE TEBET", "Simone Tebet", MDB, "SP", "sp-sen-simone-tebet.jpg"),
  mk("sp-gov-haddad", "governor", "13", "FERNANDO HADDAD", "Fernando Haddad", PT, "SP", "sp-gov-haddad.jpg"),
  mk("br-pres-lula", "president", "13", "LULA", "Luiz Inácio Lula da Silva", PT, null, "br-pres-lula.jpg"),
];
