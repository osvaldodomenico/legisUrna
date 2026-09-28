-- LegisUrna — apuração simulada + cadastro de contatos.
-- Simulação e contato ficam em tabelas SEM ligação entre si: nenhum id, sessão ou horário exato
-- permite saber em quem uma pessoa cadastrada votou.

-- Uma linha por simulação concluída (FIM). id aleatório e hora truncada: não dá para ordenar
-- nem casar com o horário de um contato.
CREATE TABLE IF NOT EXISTS simulacoes (
  id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estado CHAR(2) NOT NULL,
  hora   TIMESTAMPTZ NOT NULL DEFAULT date_trunc('hour', now())
);

-- Um voto por cargo de cada simulação.
CREATE TABLE IF NOT EXISTS votos (
  simulacao_id UUID NOT NULL REFERENCES simulacoes(id) ON DELETE CASCADE,
  cargo        TEXT NOT NULL,
  tipo         TEXT NOT NULL CHECK (tipo IN ('candidato', 'branco', 'nulo')),
  candidato_id TEXT,
  PRIMARY KEY (simulacao_id, cargo),
  CHECK ((tipo = 'candidato') = (candidato_id IS NOT NULL))
);

-- Quem aceitou receber informações da ShiftLegis. Guarda o texto aceito como prova do consentimento.
CREATE TABLE IF NOT EXISTS contatos (
  id                   BIGSERIAL PRIMARY KEY,
  nome                 TEXT NOT NULL,
  whatsapp             TEXT NOT NULL UNIQUE,
  consentimento_versao TEXT NOT NULL,
  consentimento_texto  TEXT NOT NULL,
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT now(),
  descadastrado_em     TIMESTAMPTZ
);
