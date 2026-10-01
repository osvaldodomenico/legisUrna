/**
 * Importa os candidatos de SP (+ Presidente) dos dados abertos do TSE.
 *
 *   pnpm importar:candidatos
 *
 * Baixa a planilha de candidaturas e as fotos, grava `src/data/candidatos-sp.json` e as
 * fotos em `public/candidates/tse/<SQ>.webp` (precisa do `cwebp` e do `unzip`).
 * Da planilha só saem cargo, número, nome de urna e partido — CPF, e-mail, título,
 * nascimento e demais colunas pessoais ficam de fora.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CDN = "https://cdn.tse.jus.br/estatistica/sead";
const PLANILHA = `${CDN}/odsele/consulta_cand/consulta_cand_2026.zip`;
const FOTOS = (uf: string) => `${CDN}/eleicoes/eleicoes2026/fotos/foto_cand2026_${uf}_div.zip`;
const RAIZ = join(__dirname, "..");
const SAIDA_JSON = join(RAIZ, "src/data/candidatos-sp.json");
const SAIDA_FOTOS = join(RAIZ, "public/candidates/tse");

const CARGOS: Record<string, string> = {
  "DEPUTADO FEDERAL": "federal_deputy",
  "DEPUTADO ESTADUAL": "state_deputy",
  SENADOR: "senator_1", // o engine aceita qualquer senador nas duas vagas
  GOVERNADOR: "governor",
  PRESIDENTE: "president",
};

/** Vice e suplentes: entram junto do titular de mesmo número. */
const COMPANHEIROS: Record<string, [string, "vice" | "first_alternate" | "second_alternate"]> = {
  "VICE-GOVERNADOR": ["governor", "vice"],
  "VICE-PRESIDENTE": ["president", "vice"],
  "1º SUPLENTE": ["senator", "first_alternate"],
  "2º SUPLENTE": ["senator", "second_alternate"],
};

/** CSV do TSE: separador `;`, texto entre aspas e números sem aspas. */
function lerCsv(texto: string): Record<string, string>[] {
  const linhas = texto.split(/\r?\n/).filter(Boolean);
  const campos = (l: string) => [...l.matchAll(/(?:"([^"]*)"|([^;]*))(?:;|$)/g)].map((m) => m[1] ?? m[2]).slice(0, -1);
  const cab = campos(linhas[0]);
  return linhas.slice(1).map((l) => Object.fromEntries(campos(l).map((v, i) => [cab[i], v])));
}

async function baixar(url: string, destino: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
}

async function main() {
  const tmp = mkdtempSync(join(tmpdir(), "tse-"));
  try {
    console.log("baixando planilha e fotos…");
    await baixar(PLANILHA, join(tmp, "cand.zip"));
    for (const uf of ["SP", "BR"]) await baixar(FOTOS(uf), join(tmp, `fotos-${uf}.zip`));
    execFileSync("unzip", ["-oq", join(tmp, "cand.zip"), "consulta_cand_2026_SP.csv", "consulta_cand_2026_BR.csv", "-d", tmp]);
    for (const uf of ["SP", "BR"]) execFileSync("unzip", ["-oq", join(tmp, `fotos-${uf}.zip`), "-d", join(tmp, "fotos")]);

    const latin1 = new TextDecoder("latin1");
    const linhas = ["SP", "BR"].flatMap((uf) => lerCsv(latin1.decode(readFileSync(join(tmp, `consulta_cand_2026_${uf}.csv`)))));

    // Número repetido no mesmo cargo = substituição: fica o registro mais recente (maior SQ).
    const porNumero = new Map<string, Record<string, string>>();
    const repetidos: string[] = [];
    const guardar = (chave: string, l: Record<string, string>) => {
      const atual = porNumero.get(chave);
      if (atual) repetidos.push(`${l.DS_CARGO} ${l.NR_CANDIDATO}: ${atual.NM_URNA_CANDIDATO} / ${l.NM_URNA_CANDIDATO}`);
      if (!atual || BigInt(l.SQ_CANDIDATO) > BigInt(atual.SQ_CANDIDATO)) porNumero.set(chave, l);
    };
    for (const l of linhas) {
      const cargo = CARGOS[l.DS_CARGO];
      if (cargo) guardar(`${cargo.startsWith("senator") ? "senator" : cargo}:${l.NR_CANDIDATO}`, l);
      const comp = COMPANHEIROS[l.DS_CARGO];
      if (comp) guardar(`${comp[1]}@${comp[0]}:${l.NR_CANDIDATO}`, l);
    }

    const fotos = new Map(readdirSync(join(tmp, "fotos")).map((f) => [f.replace(/^F(SP|BR)(\d+)_div\.\w+$/i, "$2"), f]));
    mkdirSync(SAIDA_FOTOS, { recursive: true });
    let semFoto = 0;
    const converter = (sq: string) => {
      const foto = fotos.get(sq);
      if (!foto) { semFoto++; return false; }
      const destino = join(SAIDA_FOTOS, `${sq}.webp`);
      if (!existsSync(destino)) execFileSync("cwebp", ["-quiet", "-q", "70", join(tmp, "fotos", foto), "-o", destino]);
      return true;
    };
    let vices = 0;
    const candidatos = [...porNumero.entries()]
      .filter(([chave]) => !chave.includes("@"))
      .map(([chave, l]) => [chave.split(":")[0], l] as const)
      .sort(([, a], [, b]) => a.DS_CARGO.localeCompare(b.DS_CARGO) || a.NR_CANDIDATO.localeCompare(b.NR_CANDIDATO))
      .map(([grupo, l]) => {
        const sq = l.SQ_CANDIDATO;
        const companheiros = (["vice", "first_alternate", "second_alternate"] as const).flatMap((papel) => {
          const c = porNumero.get(`${papel}@${grupo}:${l.NR_CANDIDATO}`);
          if (!c) return [];
          vices++;
          return [{ papel, sq: c.SQ_CANDIDATO, nome: c.NM_URNA_CANDIDATO, foto: converter(c.SQ_CANDIDATO) }];
        });
        return {
          sq,
          cargo: CARGOS[l.DS_CARGO],
          numero: l.NR_CANDIDATO,
          nome: l.NM_URNA_CANDIDATO,
          partido: l.SG_PARTIDO,
          nrPartido: Number(l.NR_PARTIDO),
          uf: l.SG_UF === "BR" ? null : l.SG_UF,
          foto: converter(sq),
          ...(companheiros.length ? { vices: companheiros } : {}),
        };
      });

    writeFileSync(SAIDA_JSON, JSON.stringify(candidatos) + "\n");
    console.log(`${candidatos.length} candidatos e ${vices} vices/suplentes gravados (${semFoto} sem foto).`);
    if (repetidos.length) console.log("Números repetidos (ficou o registro mais recente):\n  " + repetidos.join("\n  "));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
