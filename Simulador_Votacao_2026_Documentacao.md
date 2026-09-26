# Projeto — Simulador de Votação 2026 (Web/PWA)

## 1. Visão geral

Construir uma aplicação web responsiva, mobile-first e instalável como PWA para **simular a experiência de votação das Eleições Gerais de 2026**, com foco inicial nas disputas majoritárias.

A aplicação deverá reproduzir os principais comportamentos de interação conhecidos da urna eletrônica brasileira — digitação numérica, apresentação da candidatura, voto em branco, correção e confirmação — sem se apresentar como sistema oficial da Justiça Eleitoral.

### Aviso obrigatório de identidade
Em todas as telas iniciais e no rodapé:

> **SIMULAÇÃO NÃO OFICIAL — Este site não pertence, não representa e não é operado pelo TSE ou pela Justiça Eleitoral.**

Não usar brasão da República, marca do TSE, selo da Justiça Eleitoral ou elementos que possam criar impressão de produto oficial.

---

# 2. Objetivos

1. Permitir treinamento de votação por número.
2. Simular o fluxo da urna de forma intuitiva em computador, tablet e celular.
3. Aceitar entrada pelo teclado físico do computador e pelo teclado virtual/touch.
4. Exibir a candidatura somente depois que o número necessário para o cargo estiver completo.
5. Permitir candidatos reais previamente cadastrados pelo administrador.
6. Ser configurável para diferentes UFs e diferentes conjuntos de candidatos.
7. Ter UX próxima da lógica da urna, porém com identidade visual própria.
8. Ser extremamente rápida, acessível e utilizável em conexões móveis.
9. Funcionar por URL pública e opcionalmente como PWA instalável.
10. Não registrar a escolha individual do eleitor por padrão.

---

# 3. Referência oficial para Eleições 2026

Segundo o TSE, o primeiro turno das Eleições Gerais de 2026 será em **4 de outubro de 2026**.

A ordem completa da votação oficial é:

1. Deputado Federal — 4 dígitos
2. Deputado Estadual ou Distrital — 5 dígitos
3. Senador — 1ª vaga — 3 dígitos
4. Senador — 2ª vaga — 3 dígitos
5. Governador — 2 dígitos
6. Presidente da República — 2 dígitos

Para o Senado em 2026 existem duas vagas, portanto o eleitor vota duas vezes e não pode repetir a mesma candidatura para as duas vagas.

### Modo inicial deste projeto — Majoritária 2026

Como o foco solicitado é a eleição majoritária, o fluxo padrão deverá ser:

1. Senador — 1ª vaga — 3 dígitos
2. Senador — 2ª vaga — 3 dígitos
3. Governador — 2 dígitos
4. Presidente — 2 dígitos

O sistema deve possuir configuração para ativar futuramente o **Modo Eleição Completa**, acrescentando Deputado Federal e Deputado Estadual/Distrital.

---

# 4. Fontes oficiais de referência

- Eleições 2026 — TSE  
  https://www.tse.jus.br/eleicoes/eleicoes-2026

- Ordem de votação em 2026  
  https://www.tse.jus.br/comunicacao/noticias/2026/Marco/eleicoes-2026-conheca-a-ordem-de-votacao-na-urna-eletronica

- Simulador oficial do TSE  
  https://www.tse.jus.br/eleicoes/simulador-de-votacao/

- Resolução TSE nº 23.751/2026 — atos gerais  
  https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-751-de-26-de-fevereiro-de-2026

- Pesquisas eleitorais  
  https://www.tse.jus.br/eleicoes/pesquisas-eleitorais

---

# 5. Princípios de UX

## 5.1 Familiaridade sem falsificação visual

A interface pode se inspirar na organização funcional da urna:

- área de tela;
- teclado numérico;
- botão BRANCO;
- botão CORRIGE;
- botão CONFIRMA.

Entretanto, o gabinete e a identidade visual devem ser próprios.

### Não fazer

- copiar logotipos ou marcas oficiais;
- apresentar “Justiça Eleitoral” como marca do sistema;
- criar número de patrimônio, zona ou seção fictícios que pareçam oficiais;
- apresentar o projeto como urna oficial;
- usar uma captura da urna real como interface clicável.

---

# 6. Stack recomendada

## Front-end

- **Next.js + App Router**
- **TypeScript**
- **React**
- **Tailwind CSS**
- **Framer Motion / Motion** para microinterações leves
- **Zustand** para o estado da sessão de votação
- **React Hook Form + Zod** no painel administrativo
- **next-pwa** ou configuração equivalente para PWA

## Back-end

Opção recomendada:

- Next.js Server Actions / Route Handlers
- PostgreSQL
- Supabase como banco + storage + autenticação administrativa

Alternativa:

- PostgreSQL gerenciado diretamente
- Prisma ORM

## Infraestrutura

- Vercel para aplicação web
- Supabase para banco, storage de fotos e autenticação
- Cloudflare opcional para DNS, WAF e rate limiting
- Sentry para erros
- PostHog ou Plausible para telemetria **sem registrar em quem a pessoa votou**

---

# 7. Arquitetura de alto nível

```text
Usuário
   |
   v
Next.js / PWA
   |
   +--> Engine da votação
   |      |
   |      +--> State Machine
   |      +--> validação de números
   |      +--> BRANCO / CORRIGE / CONFIRMA
   |
   +--> API pública somente leitura
   |      |
   |      +--> eleição
   |      +--> cargos
   |      +--> candidatos
   |      +--> configuração visual
   |
   +--> Admin autenticado
          |
          +--> PostgreSQL / Supabase
          +--> Storage de fotos
```

---

# 8. Rotas sugeridas

```text
/                         Landing page
/simular                  Início do simulador
/simular/[uf]             Simulação configurada por UF
/simular/[uf]/votar       Tela principal
/simular/[uf]/fim         Encerramento
/como-funciona            Orientações
/privacidade               Política de privacidade
/termos                    Termos / aviso não oficial

/admin                     Login
/admin/eleicoes            Eleições configuradas
/admin/cargos              Cargos
/admin/candidatos          Candidatos
/admin/partidos            Partidos
/admin/configuracoes       UX, sons, temas e parâmetros
```

---

# 9. Fluxo da experiência

## Tela 1 — Landing

Elementos:

- título: `Simulador de Votação 2026`;
- mensagem: `Treine a sequência e a digitação antes de votar`;
- seletor de UF;
- botão `INICIAR SIMULAÇÃO`;
- link `Como funciona`;
- aviso claro: `Simulação não oficial`.

Não apresentar preferência, destaque, recomendação ou ranking de candidatos.

---

# 10. Tela principal da votação

## Desktop

Layout em duas grandes áreas:

```text
+----------------------------------------------------------+
| SIMULAÇÃO NÃO OFICIAL                                   |
+-------------------------------+--------------------------+
|                               |                          |
|         TELA DO VOTO          |     TECLADO NUMÉRICO     |
|                               |                          |
| Cargo                         |       1   2   3          |
| Número [ ][ ][ ]              |       4   5   6          |
|                               |       7   8   9          |
| Nome                          |           0              |
| Partido                       |                          |
| Foto                          | BRANCO   CORRIGE         |
| Suplentes/Vice               |       CONFIRMA           |
|                               |                          |
+-------------------------------+--------------------------+
```

## Mobile

A tela deverá ocupar 100% da largura.

Ordem vertical:

1. barra de progresso;
2. tela da candidatura;
3. número digitado;
4. teclado numérico;
5. botões funcionais.

O teclado deverá ficar próximo da zona alcançável pelo polegar.

---

# 11. Entrada por teclado físico

No desktop:

```text
0-9       -> adiciona dígito
Backspace -> equivalente a CORRIGE durante digitação
Esc       -> CORRIGE
Enter     -> CONFIRMA quando habilitado
B         -> BRANCO
```

As teclas devem ser interceptadas somente quando a tela de votação estiver ativa.

Evitar atalhos que possam conflitar com acessibilidade.

---

# 12. Teclado virtual

Formato:

```text
1 2 3
4 5 6
7 8 9
  0

BRANCO
CORRIGE
CONFIRMA
```

Requisitos:

- botões grandes;
- mínimo recomendado de 48x48 px;
- resposta visual ao toque;
- resposta sonora opcional;
- `aria-label`;
- suporte a navegação por teclado;
- foco claramente visível.

---

# 13. Estados do motor da votação

Usar uma máquina de estados explícita.

```text
READY
  |
  v
TYPING
  |
  +--> CANDIDATE_FOUND
  |
  +--> INVALID_NUMBER
  |
  +--> BLANK_PENDING
  |
  v
CONFIRM_READY
  |
  +--> CORRECT -> TYPING
  |
  +--> CONFIRM
          |
          v
      NEXT_OFFICE
          |
          v
         ...
          |
          v
        FINISHED
```

---

# 14. Regras por cargo

```ts
type OfficeConfig = {
  key:
    | "senator_1"
    | "senator_2"
    | "governor"
    | "president"
    | "federal_deputy"
    | "state_deputy";
  label: string;
  digits: number;
  order: number;
  enabled: boolean;
};
```

Modo majoritário:

```ts
[
  { key: "senator_1", label: "Senador — 1ª vaga", digits: 3, order: 1 },
  { key: "senator_2", label: "Senador — 2ª vaga", digits: 3, order: 2 },
  { key: "governor", label: "Governador", digits: 2, order: 3 },
  { key: "president", label: "Presidente", digits: 2, order: 4 }
]
```

---

# 15. Regra especial do Senado

Ao confirmar a primeira candidatura ao Senado:

```text
session.senator1CandidateId = candidate.id
```

Na segunda vaga:

```text
if candidate.id === session.senator1CandidateId:
    bloquear confirmação;
    exibir mensagem neutra:
    "Para a segunda vaga ao Senado, escolha uma candidatura diferente."
```

---

# 16. Busca da candidatura

A busca somente ocorre quando a quantidade completa de dígitos foi digitada.

Exemplo:

```text
Cargo: Governador
Dígitos exigidos: 2

Digitou: 1
=> não pesquisar ainda

Digitou: 13
=> buscar candidato número 13 para GOVERNOR na UF ativa
```

Não utilizar autocomplete.

Não sugerir números.

Não ordenar candidatos por popularidade.

---

# 17. Tela de candidatura encontrada

Apresentar:

- cargo;
- número;
- nome de urna;
- foto;
- partido/sigla;
- federação/coligação, se aplicável;
- vice ou suplentes quando aplicável.

Para Senador:

- titular;
- 1º suplente;
- 2º suplente.

Para Governador:

- titular;
- vice.

Para Presidente:

- titular;
- vice.

---

# 18. Candidato inexistente

Quando todos os dígitos forem preenchidos e não existir candidatura cadastrada:

```text
NÚMERO NÃO CADASTRADO

Confira o número digitado.

[CORRIGE]
```

Se o projeto estiver configurado para simular voto nulo, pode apresentar:

```text
VOTO NULO
```

somente se esta regra estiver deliberadamente habilitada e explicada no modo de treinamento.

---

# 19. Voto em branco

Ao tocar `BRANCO`:

```text
VOTO EM BRANCO

Pressione CONFIRMA para continuar
ou CORRIGE para voltar.
```

A confirmação não deve ocorrer com um único toque em BRANCO.

---

# 20. Corrige

Comportamento recomendado:

### Antes de completar o número

Remove todos os dígitos e retorna ao início daquele cargo.

### Depois da candidatura aparecer

Remove todos os dígitos e volta para `TYPING`.

### Depois de pressionar BRANCO

Cancela o estado `BLANK_PENDING`.

O voto já confirmado em um cargo anterior não deve ser alterado durante a sequência normal.

---

# 21. Confirma

O botão CONFIRMA somente fica ativo quando existir um estado confirmável:

- candidatura válida;
- voto em branco pendente;
- voto nulo explicitamente permitido.

Após CONFIRMA:

1. animação rápida;
2. feedback sonoro opcional;
3. salvar apenas o estado da sessão local;
4. avançar automaticamente para o próximo cargo.

---

# 22. Barra de progresso

Exemplo para majoritária:

```text
[✓ Senado 1] [Senado 2] [Governador] [Presidente]
```

No mobile:

```text
Etapa 2 de 4
Senador — 2ª vaga
████████░░░░░░░░
```

---

# 23. Tela final

Depois do último cargo:

```text
FIM

Simulação concluída.

Você completou todas as etapas da simulação.

[REINICIAR]
[SAIR]
```

Não exibir automaticamente a lista das escolhas realizadas.

Isso reduz o risco de exposição do voto simulado em tela compartilhada.

Opcionalmente permitir `Ver resumo da simulação`, mas somente após ação explícita.

---

# 24. Sons

Criar sons próprios.

Não copiar arquivos sonoros oficiais se não houver autorização/licença.

Sugestão:

- clique curto para tecla numérica;
- confirmação curta;
- som final distinto.

Adicionar:

```text
[🔊 Som ligado]
```

e respeitar `prefers-reduced-motion`.

---

# 25. Acessibilidade

Meta: WCAG 2.2 AA.

Implementar:

- navegação completa por teclado;
- foco visível;
- contraste adequado;
- textos escaláveis;
- `aria-live` para leitura dos números digitados;
- anúncio da candidatura encontrada;
- labels completos;
- não depender apenas de cor;
- opção de áudio;
- targets grandes para touch;
- suporte a leitor de tela.

### Exemplo

```html
<div aria-live="polite">
  Número digitado: 1 2 3
</div>
```

---

# 26. Responsividade

Breakpoints conceituais:

```text
< 480px   celular pequeno
480-767   celular grande
768-1023  tablet
>=1024    desktop
```

A aplicação não deve depender de orientação landscape.

---

# 27. Modelo de dados

## election

```text
id
name
year
round
election_date
mode
status
created_at
updated_at
```

## state

```text
id
code
name
```

## party

```text
id
number
acronym
name
```

## candidate

```text
id
election_id
state_id nullable
office
number
ballot_name
full_name
party_id
photo_url
status
active
created_at
updated_at
```

## running_mate

```text
id
candidate_id
role
name
ballot_name
photo_url nullable
order
```

## app_configuration

```text
id
election_id
state_id
majoritarian_only
enable_blank
enable_null
enable_audio
show_summary
theme
updated_at
```

---

# 28. Fonte dos candidatos

O sistema deve permitir duas formas.

## A. Cadastro manual

Painel administrativo para:

- criar candidatura;
- editar;
- remover/desativar;
- carregar foto;
- cadastrar partido;
- cadastrar vice/suplentes;
- selecionar UF e cargo.

## B. Importação

Criar arquitetura para integração futura com dados oficiais do TSE/DivulgaCandContas.

Antes de produção, validar:

- situação atual da candidatura;
- número;
- nome de urna;
- partido;
- foto;
- vice/suplentes;
- abrangência territorial.

Não manter candidatura cassada, indeferida ou alterada sem sincronização administrativa.

---

# 29. API

## Pública

```http
GET /api/elections/2026
GET /api/elections/2026/states/SP
GET /api/elections/2026/SP/offices
GET /api/elections/2026/SP/candidates/governor/13
```

Resposta de candidatura:

```json
{
  "office": "governor",
  "number": "13",
  "ballotName": "NOME DE URNA",
  "party": {
    "number": 13,
    "acronym": "ABC"
  },
  "photoUrl": "/media/candidate.jpg",
  "runningMates": [
    {
      "role": "vice",
      "ballotName": "VICE"
    }
  ]
}
```

## Administrativa

```http
POST   /api/admin/candidates
PATCH  /api/admin/candidates/:id
DELETE /api/admin/candidates/:id
POST   /api/admin/import
```

Toda API administrativa exige autenticação e autorização.

---

# 30. Privacidade e segredo da escolha

### Padrão recomendado

**Não transmitir ao servidor qual candidatura foi escolhida.**

Manter a sessão de votação em memória/local state.

Ao confirmar:

```ts
session.votes[office] = candidateId
```

Não enviar este objeto para analytics.

Após `FINISHED`:

```ts
clearSession();
```

### Analytics permitidos

Pode registrar de forma agregada:

- simulação iniciada;
- simulação concluída;
- abandono por etapa;
- erros de interface;
- tipo de dispositivo;
- tempo médio da sessão.

Não registrar:

- número digitado;
- candidato selecionado;
- sequência de escolhas;
- combinação de voto + IP;
- combinação de voto + fingerprint;
- combinação de voto + conta do usuário.

---

# 31. Se houver intenção de coletar resultados

Este projeto deve ser tratado, por padrão, como **treinamento**, não como enquete ou pesquisa.

Se houver armazenamento das escolhas com candidatos reais, agregação dos resultados ou divulgação pública de percentuais, interromper o desenvolvimento dessa funcionalidade até revisão jurídica eleitoral.

Pesquisas de opinião relacionadas às Eleições 2026 possuem regras específicas de registro e divulgação perante a Justiça Eleitoral/PesqEle.

Portanto:

```text
TRAINING_MODE = true
STORE_VOTE_SELECTION = false
PUBLIC_RESULTS = false
```

como configuração padrão obrigatória.

---

# 32. Segurança

Implementar:

- HTTPS obrigatório;
- CSP;
- HSTS;
- proteção contra XSS;
- CSRF no painel;
- rate limiting;
- sanitização;
- Zod na entrada;
- autenticação forte no admin;
- MFA no admin;
- logs de auditoria administrativa;
- signed URLs para uploads quando necessário;
- imagens verificadas por MIME;
- limite de tamanho;
- backup diário do banco;
- princípio de menor privilégio.

---

# 33. Painel administrativo

Dashboard:

```text
Eleições
Cargos
Candidatos
Partidos
Fotos
Configurações
Status da publicação
Logs de auditoria
```

## Cadastro de candidato

Campos:

```text
UF
Cargo
Número
Nome de urna
Nome completo
Partido
Foto
Vice / Suplentes
Situação
Ativo no simulador
```

Validações:

- número único por cargo + eleição + UF;
- comprimento correto do número;
- foto obrigatória quando configurado;
- vice obrigatório para cargos do Executivo;
- suplentes configuráveis para Senado.

---

# 34. Pré-carregamento

Antes de cada cargo:

```ts
prefetchCandidateIndex(currentOffice)
preloadNextOfficeAssets()
```

Objetivo:

- resposta instantânea ao completar o número;
- evitar loading spinner na tela de voto.

Idealmente carregar o mapa:

```ts
Map<string, Candidate>
```

do cargo atual.

---

# 35. Offline/PWA

É possível cachear:

- shell da aplicação;
- CSS;
- JS;
- fontes locais;
- configuração;
- candidatos;
- imagens reduzidas.

Após sincronização:

```text
Simulação disponível offline
Última atualização: 03/10/2026 22:10
```

Nunca usar dados antigos silenciosamente.

Se offline, mostrar a data da última sincronização.

---

# 36. Performance

Metas:

```text
LCP < 2,5s em 4G
CLS < 0,1
INP < 200ms
```

Fotos:

- AVIF/WebP;
- largura adequada;
- lazy loading onde fizer sentido;
- preload do cargo atual.

Não carregar todas as fotos do Brasil se a pessoa escolheu uma única UF.

---

# 37. Design system

## Tipografia

Fonte sem serifa altamente legível:

- Inter;
- Public Sans;
- system-ui.

## Cores

Identidade própria.

Sugestão funcional:

```text
Background       #F4F4F2
Tela             #FFFFFF
Texto            #111111
Teclas numéricas #202124
BRANCO           branco/cinza
CORRIGE          laranja
CONFIRMA         verde
```

Usar as cores funcionais de forma reconhecível sem reproduzir marca institucional.

---

# 38. Microinterações

Ao tocar número:

```text
scale 1 -> .96 -> 1
60-100ms
```

Ao encontrar candidatura:

```text
fade + translateY
120-180ms
```

Ao confirmar:

```text
feedback imediato
pause curta
avanço
```

Evitar animações decorativas longas.

---

# 39. Testes

## Unitários

- número válido;
- número inexistente;
- branco;
- corrige;
- confirma;
- bloqueio de senador repetido;
- avanço de cargo;
- reinício;
- limpeza da sessão.

## Integração

- carregar eleição;
- carregar UF;
- resolver candidato;
- foto;
- admin;
- publicação.

## E2E

Playwright:

```text
desktop Chromium
desktop Safari/WebKit
iPhone viewport
Android viewport
tablet
keyboard only
```

---

# 40. Casos E2E mínimos

### Caso 1 — voto normal

```text
Abrir
Selecionar SP
Iniciar
Digitar senador válido
Confirmar
Digitar segundo senador diferente
Confirmar
Digitar governador
Confirmar
Digitar presidente
Confirmar
Validar FIM
```

### Caso 2 — senador duplicado

```text
Confirmar candidato 123 na primeira vaga
Digitar 123 na segunda
Sistema deve bloquear
```

### Caso 3 — Corrige

```text
Digitar número
Visualizar candidatura
CORRIGE
Campos ficam vazios
```

### Caso 4 — Branco

```text
BRANCO
Mensagem
CONFIRMA
Avança
```

---

# 41. Telemetria

Eventos seguros:

```text
simulation_started
office_started
invalid_number_shown
blank_flow_used
correction_used
office_completed
simulation_completed
simulation_abandoned
```

Não adicionar:

```text
candidate_id
candidate_number
party_id
vote
```

nos eventos de analytics.

---

# 42. Observabilidade

Sentry:

```text
frontend exceptions
API failures
image failures
admin exceptions
```

Criar alertas para:

- candidato sem foto;
- duplicidade de número;
- API indisponível;
- configuração sem presidente;
- configuração sem governador;
- dados não sincronizados.

---

# 43. SEO

A simulação pode ser indexável em landing pages informativas.

Exemplo:

```text
/simulador-eleicoes-2026
/como-votar-eleicoes-2026
```

Entretanto, URLs internas de sessão não devem ser indexadas.

```html
<meta name="robots" content="noindex,nofollow">
```

para `/simular/.../votar`.

---

# 44. Metadados

```text
Title:
Simulador de Votação 2026 — Treine como votar

Description:
Simulação independente e não oficial para treinamento da sequência de votação das Eleições 2026.
```

Evitar:

```text
Urna Oficial
TSE Oficial
Sistema Oficial de Votação
```

---

# 45. LGPD

Mesmo sem armazenar votos, criar:

- política de privacidade;
- inventário dos dados;
- retenção de logs;
- cookies mínimos;
- consentimento quando aplicável;
- anonimização de IP em analytics, se suportado.

Não criar fingerprint eleitoral.

---

# 46. Critérios de aceite do MVP

O MVP estará pronto quando:

- [ ] abrir por URL pública;
- [ ] funcionar perfeitamente no celular;
- [ ] funcionar por teclado físico;
- [ ] possuir teclado virtual;
- [ ] carregar candidatos cadastrados;
- [ ] suportar os quatro estágios majoritários;
- [ ] impedir repetição do mesmo senador;
- [ ] suportar BRANCO;
- [ ] suportar CORRIGE;
- [ ] suportar CONFIRMA;
- [ ] possuir barra de progresso;
- [ ] possuir tela FIM;
- [ ] não salvar escolhas individuais no servidor;
- [ ] possuir aviso de simulação não oficial;
- [ ] possuir painel admin;
- [ ] atingir WCAG AA nos fluxos principais;
- [ ] possuir testes E2E.

---

# 47. Fases de desenvolvimento

## Fase 1 — Engine local

Criar:

- tela;
- teclado;
- máquina de estados;
- candidatos mock;
- fluxo majoritário.

## Fase 2 — Banco e Admin

Criar:

- Supabase/Postgres;
- CRUD;
- upload;
- autenticação;
- publicação.

## Fase 3 — Dados reais

- cadastrar/importar candidatos;
- validar candidatos;
- revisar fotos;
- testar todas as UFs suportadas.

## Fase 4 — PWA e acessibilidade

- offline;
- áudio;
- leitores de tela;
- teclado;
- mobile.

## Fase 5 — Segurança e QA

- pentest básico;
- testes E2E;
- performance;
- auditoria de dados.

## Fase 6 — Produção

- domínio;
- observabilidade;
- cache;
- monitoramento;
- backup.

---

# 48. Estrutura de diretórios

```text
src/
├── app/
│   ├── (public)/
│   ├── simular/
│   ├── admin/
│   └── api/
├── components/
│   ├── voting/
│   │   ├── VotingMachine.tsx
│   │   ├── VotingScreen.tsx
│   │   ├── NumericKeypad.tsx
│   │   ├── FunctionKeys.tsx
│   │   ├── CandidateCard.tsx
│   │   └── ProgressBar.tsx
│   └── ui/
├── domain/
│   └── voting/
│       ├── machine.ts
│       ├── rules.ts
│       ├── types.ts
│       └── validators.ts
├── stores/
│   └── voting-session.ts
├── services/
│   ├── candidates.ts
│   └── elections.ts
├── lib/
│   ├── db.ts
│   ├── analytics.ts
│   └── security.ts
└── styles/
```

---

# 49. Exemplo de domínio TypeScript

```ts
export type Office =
  | "senator_1"
  | "senator_2"
  | "governor"
  | "president";

export interface Candidate {
  id: string;
  office: Office;
  number: string;
  ballotName: string;
  fullName: string;
  party: {
    number: number;
    acronym: string;
    name: string;
  };
  photoUrl: string;
  runningMates: RunningMate[];
}

export interface RunningMate {
  role: "vice" | "first_alternate" | "second_alternate";
  ballotName: string;
  photoUrl?: string;
}
```

---

# 50. Prompt-base para Claude Code / Codex

```text
Você é o engenheiro principal responsável por construir uma aplicação
web/PWA chamada "Simulador de Votação 2026".

Leia integralmente a documentação do projeto antes de alterar código.

Objetivo:
construir um simulador de treinamento eleitoral, independente e não
oficial, mobile-first, inspirado na mecânica de interação da urna
eletrônica brasileira, sem se apresentar como produto do TSE.

Stack:
- Next.js App Router
- TypeScript strict
- React
- Tailwind CSS
- PostgreSQL/Supabase
- Zod
- Zustand
- Playwright
- Vitest

Regras essenciais:
1. Não usar marca, brasão ou identidade oficial do TSE.
2. Mostrar "SIMULAÇÃO NÃO OFICIAL".
3. Modo padrão: eleição majoritária 2026.
4. Ordem:
   - Senador 1
   - Senador 2
   - Governador
   - Presidente
5. Dígitos:
   - Senado: 3
   - Governador: 2
   - Presidente: 2
6. O segundo voto ao Senado não pode repetir a primeira candidatura.
7. Implementar BRANCO, CORRIGE e CONFIRMA.
8. Suportar teclado físico e touch.
9. Candidato só aparece após o preenchimento completo do número.
10. Não usar autocomplete ou recomendar candidaturas.
11. Não transmitir para analytics ou banco a escolha individual do usuário.
12. Mobile e acessibilidade são requisitos bloqueantes.
13. Criar máquina de estados explícita para o fluxo da votação.
14. Criar testes unitários, integração e E2E.
15. Nenhuma etapa será considerada concluída sem testes passando.
16. Documentar decisões arquiteturais importantes.

Antes de implementar:
- faça auditoria do repositório;
- escreva um plano;
- identifique riscos;
- proponha as migrations;
- liste os componentes;
- liste os testes.

Depois implemente por fases pequenas e verificáveis.
```

---

# 51. Recomendação de produto

Para o lançamento inicial, manter o produto estritamente como simulador de treinamento.

Não mostrar placar, totalização, “quem está ganhando” ou percentuais de candidatos.

Isso preserva a finalidade pedagógica, reduz riscos de privacidade e separa claramente o produto de uma pesquisa eleitoral.

---

# 52. Referência visual

Usar fotografias da urna somente como **referência de UX durante o design**.

A interface final deve ser desenhada em componentes próprios.

Elementos funcionais que vale reproduzir conceitualmente:

- teclado 0–9;
- BRANCO;
- CORRIGE;
- CONFIRMA;
- área de identificação da candidatura;
- sequência por cargos;
- barra de progresso;
- tela final.

---

# 53. Definição final do MVP

```text
Produto:
Simulador de Votação 2026

Tipo:
Web App + PWA

Público:
pessoas que querem treinar a votação

Modo inicial:
Majoritária

Data de referência:
04/10/2026

Cargos:
Senador 1
Senador 2
Governador
Presidente

Entrada:
touch + mouse + teclado físico

Dados:
candidatos pré-cadastrados

Persistência de voto:
NÃO

Resultados públicos:
NÃO

Admin:
SIM

Responsivo:
SIM

Offline:
SIM, após sincronização

Acessibilidade:
WCAG 2.2 AA

Aviso:
SIMULAÇÃO NÃO OFICIAL
```
