# LegisUrna — Interface "urna realista" (réplica visual de alto padrão)

Data: 2026-09-26 · Status: aprovado por Domenico (brainstorm com visual companion) · Produção atual: https://simulador.shiftlegis.com.br

## 1. Objetivo

Substituir a interface genérica do simulador por uma réplica visual da urna eletrônica brasileira, mantendo intactas a engine de votação, o store e as regras já validadas em produção. A urna vira o centro do site (fluxo completo): página de votação, tela FIM, início e escolha de UF ganham o mesmo acabamento.

Direção visual escolhida: **A · Réplica realista** — plástico bege com volume, teclas em relevo que afundam ao clicar, tela com moldura escura, aberturas de ventilação na frente. Toda em CSS (sem imagens raster do equipamento).

## 2. Restrições inegociáveis (herdadas do projeto)

- Aviso "SIMULAÇÃO NÃO OFICIAL" (texto de `DISCLAIMER_TEXT`) no topo da página de votação e no rodapé global. Não é exibido dentro da tela da urna, e sim acima da urna.
- Nenhum brasão da República, marca do TSE ou selo da Justiça Eleitoral. Onde a urna real traz o logo (painel do teclado), escreve-se **SIMULADOR**.
- Candidatura só aparece com o número completo; sem autocomplete, sugestão ou ranking.
- Nenhuma escolha individual sai do navegador; analytics continua agregado (sem candidate_id/number).
- WCAG 2.2 AA: teclado físico e virtual, foco visível, `aria-live`, alvos ≥ 48×48 px, contraste AA nos textos da tela (preto `#111` sobre `#f4f4ef`).
- `prefers-reduced-motion: reduce` desliga animações de tecla e transições de tela.

## 3. O que NÃO muda

- `src/domain/voting/*` (types, rules, validators, machine) — zero alterações.
- `src/stores/voting-session.ts` — zero alterações. A "tela de espera" e o FIM-na-urna são estados **da camada de UI**, não do store.
- `tests/voting-engine.test.ts` (23 testes) — continuam passando sem edição.
- `src/lib/analytics.ts` — eventos existentes mantidos (`simulation_started`, `office_completed`, `correction_used`, `blank_flow_used`, `simulation_completed`).
- `src/data/*` — dados de candidatos mantidos; `runningMates` continua vazio até Domenico enviar os candidatos de exemplo e fotos.

## 4. Arquitetura da UI

Novo diretório `src/components/urna/`. Cada unidade tem uma responsabilidade e uma interface pequena; nenhuma acessa o store diretamente exceto `UrnaVoting`.

### 4.1 `UrnaShell` (apresentação pura)
- Props: `screen: ReactNode`, `keypad?: ReactNode`, `size?: "full" | "display"`.
- Renderiza o corpo físico: base bege (`--urna-body`) com gradiente e sombra, moldura escura da tela (`--urna-bezel`), painel preto do teclado (`--urna-panel`; o rótulo **SIMULADOR** acima das teclas é renderizado pelo `UrnaKeypad`, que o painel sempre contém), aberturas de ventilação (fileira de ranhuras) na borda frontal.
- Layout: em `≥ 768px` tela à esquerda (≈ 60 %) e painel do teclado à direita (≈ 40 %), lado a lado; em `< 768px` empilhado (tela em cima ocupando a largura toda, teclado embaixo).
- `size="display"`: versão sem interação para a landing. Quando `keypad` é omitido, o próprio `UrnaShell` renderiza `UrnaKeypad` com handlers vazios e `decorative` (teclas com `aria-hidden`, `tabIndex=-1`, `pointer-events: none`). A página não precisa passar teclado.
- `UrnaShell` é `"use client"` (cria os handlers vazios internamente); a landing, que é server component, passa só `screen` (ReactNode) e `size`.
- Não conhece estado de votação.

### 4.2 `UrnaScreen` (apresentação pura)
- Props: `view: ScreenView`, `message?: string | null` onde
  ```ts
  type ScreenView =
    | { kind: "idle"; stateName: string | null }          // null → linha "Escolha seu estado" (landing)
    | { kind: "typing"; office: OfficeConfig; digits: string }
    | { kind: "candidate"; office: OfficeConfig; digits: string; candidate: Candidate }
    | { kind: "null"; office: OfficeConfig; digits: string }
    | { kind: "invalid"; office: OfficeConfig; digits: string }   // só com enableNull=false
    | { kind: "blank"; office: OfficeConfig }
    | { kind: "finished" }
  ```
  `officeLabel` vem de `office.label`; `totalDigits` de `office.digits`. `stateName` vem de `STATES` (`src/data/states`) a partir do `stateCode` do store; o contêiner faz essa busca.
- Área 4:3, fundo `--urna-screen` (#f4f4ef), fonte Arial, texto `#111`, sempre modo claro (`color-scheme: light` no contêiner; a tela é um objeto físico e não segue o tema da página).
- Conteúdo por `kind`:
  - `idle`: "SIMULADOR DE VOTAÇÃO 2026"; linha "Estado: {stateName}" quando há estado, ou "Escolha seu estado" quando `stateName` é `null`; barra: "Aperte a tecla VERDE para iniciar a simulação."
  - `typing`: cabeçalho "SEU VOTO PARA" + `officeLabel`; `DigitBoxes`; barra: "Digite o número do candidato." / "Para votar em branco, aperte a tecla BRANCO."
  - `candidate`: cabeçalho + `DigitBoxes` (preenchidas) + `CandidatePanel`; barra: "Aperte a tecla:" / "VERDE para CONFIRMAR este voto" / "LARANJA para REINICIAR este voto".
  - `null`: cabeçalho + `DigitBoxes` + texto central "NÚMERO ERRADO" / "VOTO NULO"; barra igual à de `candidate`.
  - `invalid` (status `INVALID_NUMBER`, só quando `enableNull=false`): cabeçalho + `DigitBoxes` + texto central "NÚMERO NÃO CADASTRADO"; barra: "Aperte a tecla LARANJA para corrigir." (CONFIRMA está bloqueado pelo store nesse estado). Hoje `enableNull` é fixo em `true`, então esta view é defensiva.
  - `blank`: cabeçalho + texto central "VOTO EM BRANCO"; barra igual à de `candidate`.
  - `finished`: "FIM" grande centralizado; rodapé pequeno "Simulação encerrada. Nenhum voto foi gravado ou enviado."
- Transição entre `kind`s: fade curto (≤ 150 ms) via CSS; desligado com reduced-motion.
- Quando `message` (texto de bloqueio do store, ex.: repetição de senador) não é vazio, ele substitui o texto padrão da barra inferior, em negrito, enquanto existir. `UrnaScreen` continua pura: recebe `message` por prop do contêiner.

### 4.3 `DigitBoxes` (apresentação pura)
- Props: `digits: string`, `total: number`.
- Renderiza `total` caixas (borda 1,5 px `#111`, fundo branco). As primeiras `digits.length` mostram o dígito; a próxima vazia tem borda mais grossa (cursor). Prefixo "Número:".

### 4.4 `CandidatePanel` (apresentação pura)
- Props: `candidate: Candidate`, `office: OfficeConfig`.
- Linhas à esquerda: "Nome: {ballotName}", "Partido: {party.acronym}", e para cada `runningMate` uma linha com rótulo por cargo:
  - `governor` → "Vice-Governador"; `president` → "Vice-Presidente"; `senator_1`/`senator_2` → "1º Suplente" / "2º Suplente" (por `role`: `first_alternate` / `second_alternate`); deputados → nenhuma linha.
- Fotos à direita: titular grande (≈ 30 % da altura da tela); cada `runningMate` com `photoUrl` ganha foto menor abaixo, com legenda curta (Vice / 1º Sup. / 2º Sup.). Sem `photoUrl` → só a linha de texto, sem espaço reservado.
- `<img onError>` esconde a imagem quebrada (fica só o texto). `alt=""` (o nome já está em texto).

### 4.5 `UrnaKeypad` (apresentação, controlada)
- Props: `onDigit(d)`, `onBlank()`, `onCorrect()`, `onConfirm()`, `confirmEnabled: boolean`, `pressedKey?: KeyId | null`, `decorative?: boolean`, com `type KeyId = "0" | … | "9" | "BRANCO" | "CORRIGE" | "CONFIRMA"` exportado pelo componente e usado pelo contêiner ao traduzir o teclado físico.
- `decorative=true` só é usado pelo `UrnaShell size="display"` (ver 4.1). Não há prop `disabled`: na view `finished` as teclas continuam clicáveis e o contêiner as ignora (ver 4.8).
- Grid 3×4: 1-9, 0 centralizado na última linha; abaixo, BRANCO (branca, texto preto), CORRIGE (laranja `--key-corrige`), CONFIRMA (verde `--key-confirma`, maior).
- Teclas numéricas: escuras com gradiente e "espessura" (box-shadow em Y); ao pressionar (`:active` ou `pressedKey === label`) translada 2 px e reduz a sombra. `pressedKey` permite acender a tecla quando o teclado físico é usado (≈ 120 ms).
- CONFIRMA com `confirmEnabled=false` fica visualmente igual (urna real não desabilita a tecla); o clique chama `onConfirm`, que decide (beep de erro / mensagem). `aria-disabled` reflete o estado para leitores de tela.
- Todos os botões: ≥ 48×48 px, `focus-visible` com anel claro sobre o painel escuro, `aria-label` completo ("Tecla 1", "Branco", "Corrige", "Confirma").

### 4.6 `ProgressStrip`
- Props: `offices: OfficeConfig[]`, `currentIndex: number`, `finished?: boolean`.
- Substitui `ProgressBar`. Desktop: lista horizontal dos 6 cargos com o atual em destaque e os feitos marcados; celular: "Cargo {n} de {total}" + barra fina. Mantém `role="progressbar"` e `aria-current="step"`.

### 4.7 `SoundToggle`
- Botão de mudo ao lado da urna. Persiste em `localStorage` (`legisurna:muted`), com try/catch; o valor é lido em `useEffect` (não no primeiro render) para evitar divergência de hidratação no SSR, e esse mesmo efeito chama `setMuted()` do módulo de áudio para o estado do botão e o do som nunca divergirem. `aria-pressed`.
- `src/lib/audio.ts` recebe: `setMuted(bool)`, `isMuted()`, e `sfx.fim()` (tom mais longo, ≈ 700 ms, dois estágios). `beep` retorna sem tocar quando mutado.

### 4.8 `UrnaVoting` (contêiner; único que fala com o store)
- Substitui `VotingScreen`. Usa `useVotingSession` e mantém dois estados locais de UI: `started: boolean` (tela de espera) e `pressedKey`.
- Mapeia store → `ScreenView`:
  - `!started` → `idle`
  - `status === "FINISHED"` → `finished`
  - `BLANK_PENDING` → `blank`
  - `CANDIDATE_FOUND` → `candidate`
  - `CONFIRM_READY` → `null`
  - `INVALID_NUMBER` → `invalid`
  - demais (`TYPING`, `READY`) → `typing`
- Regras da tela de espera: enquanto `!started`, dígitos, BRANCO e CORRIGE são ignorados pelo contêiner (toca só `sfx.digit` para qualquer um deles, sem chamar o store); CONFIRMA define `started = true` e toca `sfx.confirm`. Só então `track("simulation_started", { state: stateCode, mode: "completo" })` é disparado (hoje dispara no `mount`; passa a disparar no início real, com o mesmo payload).
- `confirmEnabled` passado ao teclado é `!started || isConfirmEnabled()`: na tela de espera a tecla verde é justamente a que inicia, então não pode aparecer como `aria-disabled`.
- `ProgressStrip` é renderizado por `UrnaVoting` (que tem `started`, `currentIndex` e `status`), acima do `UrnaShell`. Em `idle` mostra cargo 1 de 6 sem nenhum concluído; em `finished` mostra todos concluídos.
- Eventos de analytics mantidos nos mesmos pontos de hoje: `office_completed` (`{ office, index }`) em cada CONFIRMA aceito, `correction_used` (`{ office }`) em CORRIGE, `blank_flow_used` (`{ office }`) em BRANCO. `simulation_completed` passa a disparar **uma vez só**, em `FINISHED`, com `{ state: stateCode, total_offices: offices.length }` (hoje dispara duas vezes, em `VotingScreen` e na página `fim`).
- No último cargo, o CONFIRMA aceito toca **só** `sfx.fim()` (não toca `sfx.confirm` antes); nos demais cargos toca `sfx.confirm`. Detecção: após `confirm()` retornar `"ok"`, ler `useVotingSession.getState().status === "FINISHED"` (não comparar índices).
- Ao `FINISHED`: exibe `finished` na tela e mostra abaixo da urna os botões **Votar novamente** (chama `restart()`, zera `started`, volta para `idle`) e **Sair** (link para `/`). Não navega para outra rota. Nesse estado, dígitos, BRANCO, CORRIGE e CONFIRMA (virtuais ou físicos) são ignorados pelo contêiner sem som e sem chamar o store.
- Teclado físico igual ao atual (0-9, Backspace/Esc, Enter, B), agora também acendendo `pressedKey`. O handler retorna cedo **sem** `preventDefault()` em três casos: view `finished` (para Enter/Espaço continuarem ativando os botões **Votar novamente**/**Sair** focados), foco em `input`/`textarea`/`button`/`a` (para não roubar o Enter nativo do elemento focado) e tecla não mapeada. Só chama `preventDefault()` quando de fato consome a tecla.
- `aria-live` (região `sr-only`) com as mesmas mensagens de hoje, mais "Urna pronta. Aperte Confirma para iniciar." e "Fim da votação.".

### 4.9 `VotingMachine`
- Mantido como ponto de entrada da rota; passa a renderizar `DisclaimerBanner` + `UrnaVoting` (que contém `ProgressStrip`, `UrnaShell`, `UrnaScreen`, `UrnaKeypad`) + `SoundToggle`. `init()` continua no mount.

### 4.10 Tokens de design (`globals.css`)
```css
:root {
  --urna-body: #e8e4d8;  --urna-body-dark: #cfcabb;
  --urna-bezel: #1f2327; --urna-screen: #f4f4ef; --urna-ink: #111111;
  --urna-panel: #24282c; --key-dark: #2f343a; --key-dark-edge: #0b0d0f;
  --key-branco: #ffffff; --key-corrige: #f0731f; --key-confirma: #1f9d55;
  --stage: #eef0f2;
}
:root:not([data-theme="light"]) { @media (prefers-color-scheme: dark) { --stage: #0f172a; } }
```
Só `--stage` (fundo da página) muda no escuro; a urna é sempre a mesma.

## 5. Páginas

| Rota | Mudança |
|---|---|
| `/` | Hero com `UrnaShell size="display"` mostrando `UrnaScreen` em `idle` ("Estado: —" substituído por "Escolha seu estado"), título, texto curto, CTA **Começar simulação** (estilo tecla verde) → `/simular`. Lista dos 6 cargos mantida abaixo. Disclaimer no topo. |
| `/simular` | Mesmo conteúdo; visual alinhado (fundo `--stage`, cards de UF com borda bege/neutra, foco visível). |
| `/simular/[uf]` | Mesmo conteúdo; CTA **Iniciar votação** no estilo tecla verde. |
| `/simular/[uf]/votar` | `VotingMachine` novo (urna interativa). `robots: noindex, nofollow` mantido. |
| `/simular/[uf]/fim` | **Removida** (o FIM ocorre dentro da urna em `/votar`). Links para `fim` deixam de existir. |
| `/como-funciona`, `/privacidade`, `/termos` | Sem alteração de conteúdo; só herdam `--stage`. |

Componentes que ficam sem uso e são removidos: `VotingScreen.tsx`, `NumericKeypad.tsx`, `CandidateCard.tsx`, `ProgressBar.tsx`.

## 6. Estados de erro e bordas

- Foto ausente ou quebrada → esconder `<img>`, manter texto.
- Áudio indisponível/bloqueado pelo navegador → silêncio (comportamento atual).
- `localStorage` indisponível → mudo não persiste, sem erro.
- Reload em `/votar` → volta à tela de espera (sessão em memória, como hoje).
- `restart()` após FIM → store zera e `started = false` (tela de espera de novo).
- Repetição do senador na 2ª vaga → `message` do store aparece na barra da tela; CONFIRMA toca `sfx.error`.
- Tela muito estreita (< 360 px) → teclado mantém 48 px por tecla com `gap` reduzido; a tela da urna nunca fica abaixo de 280 px de largura.

## 7. Verificação (sem suíte de UI; loop real)

1. `pnpm build` e `pnpm exec eslint src` sem erros; `pnpm test` com os 23 testes passando.
2. `.claude/checkup.sh` atualizado:
   - rotas: `/`, `/simular`, `/como-funciona`, `/privacidade`, `/termos` existem; `src/app/simular/[uf]/fim` **não** existe;
   - `src/components/urna/{UrnaShell,UrnaScreen,UrnaKeypad,CandidatePanel,DigitBoxes,ProgressStrip,SoundToggle,UrnaVoting}.tsx` existem;
   - `UrnaScreen.tsx` contém "NÚMERO ERRADO", "VOTO EM BRANCO", "FIM" e "SEU VOTO PARA";
   - nenhum arquivo em `src/components/urna/` contém "TSE", "Justiça Eleitoral" ou "brasão" (`grep -rw`, sensível a maiúsculas; a urna não usa a marca; menções informativas em `layout.tsx`, `page.tsx`, dados e páginas de texto continuam permitidas);
   - privacidade: `analytics.ts` sem `candidate_id` fora de comentários (regra atual).
3. Verificação visual local (`pnpm dev`): as seis telas (espera, digitando, candidato, nulo, branco, FIM) em 1280 px e em 390 px, com screenshots salvos em `docs/superpowers/specs/screenshots/` para o histórico. Sem Playwright no projeto, o executor gera por Chrome headless só as telas alcançáveis por URL (landing e espera); as quatro telas interativas são conferidas por Domenico com um roteiro e ele salva os screenshots na mesma pasta.
4. Deploy pelo procedimento registrado (build com `--memory=3g` na VPS BI, tag `legisurna:<sha>`, `docker run` com as labels do Traefik) e smoke em produção: rotas 200, `/simular/SP/fim` → 404, aviso presente, `noindex` em `/votar`.

## 8. Fora de escopo (explicitamente)

- Fotos de vice/suplentes e candidatos de exemplo: Domenico envia depois; entram só como dados.
- Banco/admin (Fase 2), PWA offline (Fase 4), Sentry/PostHog (Fase 6).
- Áudio idêntico ao da urna oficial (proibido pela spec original; sons continuam próprios).
- Modo escuro para a urna em si.
- `src/app/como-funciona/page.tsx` ainda descreve a ordem antiga de 4 cargos (sujeira pré-existente). Fica como está; avisar Domenico e corrigir só se ele pedir.
