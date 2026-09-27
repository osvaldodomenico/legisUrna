/**
 * Tipos derivados do swagger do DivulgaCandContas
 * (`divulgacandcontas-swagger.yaml`, v1.0.0, repo `augusto-herrmann/divulgacandcontas-doc`).
 *
 * Regra do projeto: nada de PII entra no banco nem em log. Por isso os campos
 * `cpf`, `tituloEleitor` e `dataDeNascimento` do schema NÃO são declarados aqui.
 * Se aparecerem na resposta, `toCandidate` os ignora. `cpf` também não pode
 * virar parte de nenhum identificador.
 */

export interface DivulgaPartido {
  id?: number;
  sigla: string;
  nome?: string | null;
}

export interface DivulgaEleicao {
  id?: number;
  siglaUF?: string | null;
  localidadeSgUe?: string | null;
  ano?: number | null;
  codigo?: number | null;
  nomeEleicao?: string | null;
  tipoEleicao?: string | null;
  turno?: number | null;
  tipoAbrangencia?: string | null;
  dataEleicao?: string | null;
  codSituacaoEleicao?: number | null;
  descricaoSituacaoEleicao?: string | null;
}

export interface DivulgaArquivo {
  idArquivo?: number;
  nome?: string | null;
  url?: string | null;
  tipo?: string | null;
  codTipo?: string | null;
}

export interface DivulgaCandidato {
  id: number;
  nomeUrna?: string | null;
  numero?: number | null;
  /** Referência ao candidato do cargo superior (vice/suplente). O TSE modela assim. */
  idCandidatoSuperior?: number | null;
  nomeCompleto?: string | null;
  descricaoSexo?: string | null;
  descricaoEstadoCivil?: string | null;
  descricaoCorRaca?: string | null;
  partido?: DivulgaPartido | null;
  eleicao?: DivulgaEleicao | null;
  arquivos?: DivulgaArquivo[] | null;
  eleicoesAnteriores?: DivulgaCandidato[] | null;
}

export interface DivulgaAnoEleitoral {
  ano: number;
}

export interface DivulgaEleicaoOrdinaria {
  id: number;
  ano?: number | null;
  codigo?: number | null;
  nomeEleicao?: string | null;
  tipoEleicao?: string | null;
  tipoAbrangencia?: string | null;
  descricaoSituacaoEleicao?: string | null;
  eleicoesAnteriores?: DivulgaEleicaoOrdinaria[] | null;
}

export interface DivulgaCargo {
  id: number;
  codigo?: number | null;
  nome?: string | null;
  descricaoSexo?: string | null;
}

export interface DivulgaMunicipio {
  id?: number;
  nome?: string | null;
  codigo?: number | null;
  UF?: string | null;
}
