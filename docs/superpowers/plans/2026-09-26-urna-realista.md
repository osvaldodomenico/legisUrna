# Urna Realista — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a UI genérica do simulador por uma réplica visual realista da urna eletrônica (tela 4:3 com o layout real, teclado em relevo, corpo bege), mantendo engine, store e testes intactos, com o FIM dentro da urna e o mesmo acabamento no início e na escolha de UF.

**Architecture:** Nova pasta `src/components/urna/` com componentes de apresentação puros (`UrnaShell`, `UrnaScreen`, `DigitBoxes`, `CandidatePanel`, `UrnaKeypad`, `ProgressStrip`, `SoundToggle`) e um único contêiner (`UrnaVoting`) que fala com o store Zustand. A tradução store → tela fica numa função pura (`toScreenView`) coberta por vitest. Toda a aparência física vive em `src/styles/urna.css` com tokens em `globals.css`. As páginas `/`, `/simular`, `/simular/[uf]` recebem o mesmo acabamento; `/simular/[uf]/fim` e os componentes antigos em `src/components/voting/` (exceto `VotingMachine`) são removidos.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4 (+ CSS puro para a urna), Zustand 5, vitest 5, pnpm. Sem lib de teste de DOM: a lógica testável fica em funções puras; a UI é verificada por build, lint, `checkup.sh` e inspeção visual.

**Spec:** `docs/superpowers/specs/2026-09-26-urna-realista-design.md` — consulte para textos exatos das telas (seção 4.2), regras do contêiner (4.8) e verificação (7).

**Convenções para quem executa:**
- Commits em português, terminando com `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Rodar sempre `pnpm exec eslint src` e `pnpm build` antes de commitar tarefas que tocam TSX; `pnpm test` quando tocar `src/components/urna/screen-view.ts`, `src/lib/audio.ts` ou `tests/`.
- Não tocar em `src/domain/voting/*`, `src/stores/voting-session.ts`, `src/data/*`, `tests/voting-engine.test.ts`.
- Textos da urna são em português, com acentos, exatamente como na spec.

---

## Chunk 1: Fundações e componentes de apresentação

### Task 1: Tokens de design e folha de estilo da urna

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/styles/urna.css`

- [ ] **Step 1: Adicionar tokens e importar a folha da urna em `globals.css`**

Substituir o conteúdo de `src/app/globals.css` por:

```css
@import "tailwindcss";
@import "../styles/urna.css";

:root {
  color-scheme: light dark;

  /* Urna (objeto físico — não muda com o tema) */
  --urna-body: #e8e4d8;
  --urna-body-dark: #cfcabb;
  --urna-bezel: #1f2327;
  --urna-screen: #f4f4ef;
  --urna-ink: #111111;
  --urna-panel: #24282c;
  --key-dark: #2f343a;
  --key-dark-edge: #0b0d0f;
  --key-branco: #ffffff;
  --key-corrige: #f0731f;
  --key-confirma: #1f9d55;

  /* Palco (fundo da página — único token que segue o tema) */
  --stage: #eef0f2;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --stage: #0f172a;
  }
}

:root[data-theme="dark"] {
  --stage: #0f172a;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  background: var(--stage);
}
```

- [ ] **Step 2: Criar `src/styles/urna.css` com a aparência física**

```css
/* Aparência física da urna. Toda a "realidade" (volume, relevo, ranhuras) fica aqui;
   os componentes TSX só aplicam classes. Sem imagens. */

.urna {
  --urna-radius: 18px;
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  padding: 20px 16px 34px;
  border-radius: var(--urna-radius) var(--urna-radius) 12px 12px;
  background:
    linear-gradient(168deg, #f5f3ec 0%, var(--urna-body) 45%, var(--urna-body-dark) 100%);
  box-shadow:
    0 28px 44px -18px rgba(0, 0, 0, 0.5),
    0 2px 0 rgba(255, 255, 255, 0.7) inset,
    0 -8px 16px rgba(0, 0, 0, 0.08) inset;
  color-scheme: light;
}

@media (min-width: 768px) {
  .urna {
    grid-template-columns: 3fr 2fr;
    gap: 24px;
    padding: 28px 28px 40px;
  }
}

/* Modo exibição (landing): menor e sem interação */
.urna--display {
  max-width: 640px;
  pointer-events: none;
  user-select: none;
}

/* Ranhuras de ventilação na borda frontal */
.urna__vents {
  position: absolute;
  left: 40px;
  right: 40px;
  bottom: 12px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}
.urna__vents i {
  width: 4px;
  height: 12px;
  border-radius: 2px;
  background: #3a3a3a;
  opacity: 0.7;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
}

/* Tela: moldura escura + vidro claro, sempre 4:3 */
.urna__bezel {
  padding: 10px;
  border-radius: 8px;
  background: linear-gradient(#2a2f34, var(--urna-bezel));
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.5),
    0 6px 14px rgba(0, 0, 0, 0.25) inset;
}
.urna__screen {
  position: relative;
  aspect-ratio: 4 / 3;
  min-width: 0;
  overflow: hidden;
  border-radius: 3px;
  background: var(--urna-screen);
  color: var(--urna-ink);
  font-family: Arial, Helvetica, sans-serif;
  box-shadow: 0 0 0 1px #000 inset;
  container-type: inline-size;
}
.urna__screen-inner {
  position: absolute;
  inset: 0;
  /* Tipografia escala com a largura da TELA (cqw resolve contra o ancestral .urna__screen) */
  font-size: clamp(11px, 2.6cqw, 18px);
  display: flex;
  flex-direction: column;
  padding: 5.5% 5% 0;
  animation: urna-fade 150ms ease-out;
}
@keyframes urna-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.urna__title { font-weight: 700; font-size: 0.85em; }
.urna__office { font-weight: 700; font-size: 1.5em; text-align: center; margin: 0.5em 0 0.9em; }
.urna__line { line-height: 1.75; }
.urna__center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: 700;
  font-size: 1.6em;
  line-height: 1.4;
  padding-bottom: 20%;
}
.urna__fim {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 5em;
  letter-spacing: 0.12em;
  padding-bottom: 12%;
}

/* Barra de instruções, colada na base da tela */
.urna__bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0.6em 5%;
  border-top: 1.5px solid var(--urna-ink);
  background: var(--urna-screen);
  font-size: 0.85em;
  line-height: 1.5;
  white-space: pre-line;
}
.urna__bar--alert { font-weight: 700; }
.urna__bar--muted { border-top: 0; text-align: center; color: #555; font-size: 0.75em; }

/* Número em caixas */
.urna__digits { display: flex; align-items: center; gap: 0.3em; margin-bottom: 0.7em; }
.urna__box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.55em;
  height: 2.1em;
  border: 1.5px solid var(--urna-ink);
  background: #fff;
  font-size: 1.35em;
  font-weight: 700;
}
.urna__box--cursor { border-width: 2.5px; }

/* Painel do candidato: texto à esquerda, fotos à direita */
.urna__candidate { display: grid; grid-template-columns: 1fr auto; gap: 0.8em; align-items: start; }
.urna__photos { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4em; }
.urna__photo {
  display: block;
  object-fit: cover;
  border: 1px solid #555;
  background: #c9ced4;
}
.urna__photo--main { width: 6.4em; height: 8.2em; }
.urna__photo--mate { width: 3.6em; height: 4.6em; }
.urna__photo-cap { font-size: 0.65em; text-align: center; margin-top: 0.15em; }

/* Painel do teclado */
.urna__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 14px 18px;
  border-radius: 10px;
  background: linear-gradient(#2c3035, var(--urna-panel));
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6) inset, 0 1px 0 rgba(255, 255, 255, 0.4);
}
.urna__panel-label {
  color: #d7dbdf;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-align: center;
}
.urna__keys { display: grid; grid-template-columns: repeat(3, minmax(48px, 1fr)); gap: 10px; width: 100%; max-width: 260px; }
.urna__fn { display: grid; grid-template-columns: 1fr 1fr 1.35fr; gap: 8px; width: 100%; max-width: 260px; align-items: end; }

/* Tecla física: relevo com "espessura" no eixo Y */
.urna-key {
  --edge: var(--key-dark-edge);
  --face: var(--key-dark);
  --ink: #fff;
  position: relative;
  min-width: 48px;
  min-height: 48px;
  border: 0;
  border-radius: 6px;
  background: linear-gradient(color-mix(in srgb, var(--face) 78%, white), var(--face));
  color: var(--ink);
  font: 700 1.25rem/1 Arial, Helvetica, sans-serif;
  box-shadow: 0 4px 0 var(--edge), 0 6px 10px rgba(0, 0, 0, 0.45), 0 1px 0 rgba(255, 255, 255, 0.18) inset;
  cursor: pointer;
  transition: transform 60ms ease-out, box-shadow 60ms ease-out;
  touch-action: manipulation;
}
.urna-key:active,
.urna-key--pressed {
  transform: translateY(2px);
  box-shadow: 0 2px 0 var(--edge), 0 2px 4px rgba(0, 0, 0, 0.45), 0 1px 0 rgba(255, 255, 255, 0.18) inset;
}
.urna-key:focus-visible { outline: 3px solid #93c5fd; outline-offset: 3px; }
.urna-key--zero { grid-column: 2; }
.urna-key--fn { font-size: 0.7rem; letter-spacing: 0.04em; min-height: 52px; }
.urna-key--branco { --face: var(--key-branco); --edge: #8f9398; --ink: #111; }
.urna-key--corrige { --face: var(--key-corrige); --edge: #9a3a06; --ink: #111; }
.urna-key--confirma { --face: var(--key-confirma); --edge: #0b4d24; --ink: #111; min-height: 64px; }
.urna-key[aria-disabled="true"] { opacity: 0.92; }

/* CTAs fora da urna (landing, Votar novamente/Sair) reutilizam .urna-key .urna-key--confirma / --branco; não criar classe nova. */

@media (prefers-reduced-motion: reduce) {
  .urna__screen-inner { animation: none; }
  .urna-key { transition: none; }
  .urna-key:active, .urna-key--pressed { transform: none; }
}
```

- [ ] **Step 3: Verificar que o build ainda passa**

Run: `pnpm build 2>&1 | tail -5`
Expected: `✓ Compiled successfully` (nenhuma rota nova ainda; só CSS).

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/styles/urna.css
git commit -m "urna: tokens de design e folha de estilo física da urna

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Áudio — mudo persistente e som do FIM

**Files:**
- Modify: `src/lib/audio.ts`
- Create: `tests/audio.test.ts`

- [ ] **Step 1: Escrever o teste (falha porque `setMuted`/`isMuted`/`sfx.fim` não existem)**

`tests/audio.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { sfx, setMuted, isMuted, subscribeMuted } from "@/lib/audio";

describe("audio", () => {
  it("começa sem mudo e alterna", () => {
    expect(isMuted()).toBe(false);
    setMuted(true);
    expect(isMuted()).toBe(true);
    setMuted(false);
    expect(isMuted()).toBe(false);
  });
  it("notifica assinantes ao mudar o mudo e permite cancelar", () => {
    const seen: boolean[] = [];
    const unsubscribe = subscribeMuted(() => seen.push(isMuted()));
    setMuted(true);
    setMuted(false);
    unsubscribe();
    setMuted(true);
    setMuted(false);
    expect(seen).toEqual([true, false]);
  });
  it("expõe os sons esperados, incluindo fim", () => {
    expect(Object.keys(sfx).sort()).toEqual(["blank", "confirm", "correct", "digit", "error", "fim"]);
  });
  it("não lança fora do navegador (window indefinido)", () => {
    expect(() => sfx.digit()).not.toThrow();
    expect(() => sfx.fim()).not.toThrow();
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `pnpm test 2>&1 | tail -8`
Expected: FAIL em `tests/audio.test.ts` — `isMuted is not a function` (primeira chamada), `subscribeMuted is not a function`, chaves sem `fim`.

- [ ] **Step 3: Implementar em `src/lib/audio.ts`**

```ts
// Sons próprios (não copiar áudios oficiais da urna).
let ctx: AudioContext | null = null;
let muted = false;
const listeners = new Set<() => void>();

/** Única fonte de verdade do mudo. A UI assina via `subscribeMuted` (useSyncExternalStore). */
export function setMuted(value: boolean): void {
  if (muted === value) return;
  muted = value;
  listeners.forEach((l) => l());
}

export function isMuted(): boolean {
  return muted;
}

export function subscribeMuted(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function tone(freq: number, ms: number, startOffsetMs = 0): void {
  if (typeof window === "undefined" || muted) return;
  try {
    ctx ??= new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    const start = ctx.currentTime + startOffsetMs / 1000;
    osc.start(start);
    osc.stop(start + ms / 1000);
  } catch {
    // áudio indisponível: seguir silenciosamente
  }
}

export const sfx = {
  digit: () => tone(880, 60),
  blank: () => tone(440, 120),
  correct: () => tone(330, 100),
  confirm: () => tone(660, 160),
  error: () => tone(220, 200),
  // Tom do FIM: dois estágios, ~700 ms no total.
  fim: () => {
    tone(523, 300);
    tone(784, 400, 300);
  },
};
```

- [ ] **Step 4: Rodar os testes**

Run: `pnpm test 2>&1 | tail -6`
Expected: `Test Files  2 passed`, `Tests  27 passed` (23 antigos + 4 novos).

- [ ] **Step 5: Commit**

```bash
git add src/lib/audio.ts tests/audio.test.ts
git commit -m "audio: mudo com assinantes (fonte única) e tom do FIM

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: `toScreenView` e rótulos de vice/suplentes (lógica pura, testada)

**Files:**
- Create: `src/components/urna/screen-view.ts`
- Create: `tests/screen-view.test.ts`

- [ ] **Step 1: Escrever os testes**

`tests/screen-view.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { toScreenView, runningMateLabel, runningMateShort } from "@/components/urna/screen-view";
import { FULL_OFFICES } from "@/domain/voting/rules";
import type { Candidate } from "@/domain/voting/types";

const gov = FULL_OFFICES.find((o) => o.key === "governor")!;
const cand: Candidate = {
  id: "x", office: "governor", number: "10", ballotName: "X", fullName: "X",
  party: { number: 10, acronym: "P", name: "P" }, photoUrl: "", stateCode: "SP", runningMates: [],
};
const base = { started: true, stateName: "São Paulo", office: gov, digits: "", foundCandidate: null as Candidate | null };

describe("toScreenView", () => {
  it("idle antes de iniciar, independente do status", () => {
    expect(toScreenView({ ...base, started: false, status: "TYPING" })).toEqual({ kind: "idle", stateName: "São Paulo" });
  });
  it("typing em READY/TYPING", () => {
    expect(toScreenView({ ...base, status: "READY" })).toEqual({ kind: "typing", office: gov, digits: "" });
    expect(toScreenView({ ...base, status: "TYPING", digits: "1" })).toEqual({ kind: "typing", office: gov, digits: "1" });
  });
  it("candidate quando encontrado", () => {
    expect(toScreenView({ ...base, status: "CANDIDATE_FOUND", digits: "10", foundCandidate: cand }))
      .toEqual({ kind: "candidate", office: gov, digits: "10", candidate: cand });
  });
  it("null em CONFIRM_READY e invalid em INVALID_NUMBER", () => {
    expect(toScreenView({ ...base, status: "CONFIRM_READY", digits: "99" })).toEqual({ kind: "null", office: gov, digits: "99" });
    expect(toScreenView({ ...base, status: "INVALID_NUMBER", digits: "99" })).toEqual({ kind: "invalid", office: gov, digits: "99" });
  });
  it("blank em BLANK_PENDING", () => {
    expect(toScreenView({ ...base, status: "BLANK_PENDING" })).toEqual({ kind: "blank", office: gov });
  });
  it("finished em FINISHED ou sem cargo", () => {
    expect(toScreenView({ ...base, status: "FINISHED" })).toEqual({ kind: "finished" });
    expect(toScreenView({ ...base, status: "TYPING", office: null })).toEqual({ kind: "finished" });
  });
});

describe("runningMateLabel", () => {
  it("rótulos por cargo e papel", () => {
    expect(runningMateLabel("governor", "vice")).toBe("Vice-Governador");
    expect(runningMateLabel("president", "vice")).toBe("Vice-Presidente");
    expect(runningMateLabel("senator_1", "first_alternate")).toBe("1º Suplente");
    expect(runningMateLabel("senator_2", "second_alternate")).toBe("2º Suplente");
    expect(runningMateLabel("federal_deputy", "vice")).toBeNull();
    expect(runningMateLabel("governor", "first_alternate")).toBeNull();
  });
  it("legenda curta das fotos", () => {
    expect(runningMateShort("vice")).toBe("Vice");
    expect(runningMateShort("first_alternate")).toBe("1º Sup.");
    expect(runningMateShort("second_alternate")).toBe("2º Sup.");
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `pnpm test 2>&1 | tail -8`
Expected: FAIL — `Failed to resolve import "@/components/urna/screen-view"`.

- [ ] **Step 3: Implementar `src/components/urna/screen-view.ts`**

```ts
import type { Candidate, Office, OfficeConfig, RunningMate, VotingStatus } from "@/domain/voting/types";

/** O que a tela da urna mostra. Derivado do store + estado local `started`; sem React. */
export type ScreenView =
  | { kind: "idle"; stateName: string | null }
  | { kind: "typing"; office: OfficeConfig; digits: string }
  | { kind: "candidate"; office: OfficeConfig; digits: string; candidate: Candidate }
  | { kind: "null"; office: OfficeConfig; digits: string }
  | { kind: "invalid"; office: OfficeConfig; digits: string }
  | { kind: "blank"; office: OfficeConfig }
  | { kind: "finished" };

export function toScreenView(input: {
  started: boolean;
  stateName: string | null;
  status: VotingStatus;
  office: OfficeConfig | null;
  digits: string;
  foundCandidate: Candidate | null;
}): ScreenView {
  if (!input.started) return { kind: "idle", stateName: input.stateName };
  if (input.status === "FINISHED" || !input.office) return { kind: "finished" };
  const { office, digits } = input;
  switch (input.status) {
    case "BLANK_PENDING":
      return { kind: "blank", office };
    case "CANDIDATE_FOUND":
      return input.foundCandidate
        ? { kind: "candidate", office, digits, candidate: input.foundCandidate }
        : { kind: "typing", office, digits };
    case "CONFIRM_READY":
      return { kind: "null", office, digits };
    case "INVALID_NUMBER":
      return { kind: "invalid", office, digits };
    default:
      return { kind: "typing", office, digits };
  }
}

/** Rótulo da linha de texto do vice/suplente na tela, ou null quando o cargo não tem. */
export function runningMateLabel(office: Office, role: RunningMate["role"]): string | null {
  if (role === "vice") {
    if (office === "governor") return "Vice-Governador";
    if (office === "president") return "Vice-Presidente";
    return null;
  }
  if (office === "senator_1" || office === "senator_2") {
    return role === "first_alternate" ? "1º Suplente" : "2º Suplente";
  }
  return null;
}

/** Legenda curta sob a foto pequena. */
export function runningMateShort(role: RunningMate["role"]): string {
  if (role === "vice") return "Vice";
  return role === "first_alternate" ? "1º Sup." : "2º Sup.";
}
```

- [ ] **Step 4: Rodar os testes**

Run: `pnpm test 2>&1 | tail -6`
Expected: `Test Files  3 passed`, `Tests  35 passed` (23 + 4 + 8).

- [ ] **Step 5: Commit**

```bash
git add src/components/urna/screen-view.ts tests/screen-view.test.ts
git commit -m "urna: toScreenView e rótulos de vice/suplentes (lógica pura com testes)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: `DigitBoxes` e `CandidatePanel`

**Files:**
- Create: `src/components/urna/DigitBoxes.tsx`
- Create: `src/components/urna/CandidatePanel.tsx`

- [ ] **Step 1: Criar `DigitBoxes.tsx`**

```tsx
/** Caixas do número na tela da urna. As primeiras `digits.length` mostram o dígito;
 *  a próxima vazia recebe borda grossa (cursor). */
export function DigitBoxes({ digits, total }: { digits: string; total: number }) {
  return (
    <div className="urna__digits" role="group" aria-label={`Número: ${digits || "vazio"}`}>
      <span>Número:</span>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={"urna__box" + (i === digits.length ? " urna__box--cursor" : "")}
          aria-hidden
        >
          {digits[i] ?? ""}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Criar `CandidatePanel.tsx`**

```tsx
"use client";

import type { SyntheticEvent } from "react";
import type { Candidate, OfficeConfig } from "@/domain/voting/types";
import { runningMateLabel, runningMateShort } from "./screen-view";

function hideBroken(e: SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = "none";
}

/** Linhas Nome/Partido/Vice ou Suplentes à esquerda; fotos à direita.
 *  Vice/suplente sem photoUrl aparece só em texto. */
export function CandidatePanel({ candidate, office }: { candidate: Candidate; office: OfficeConfig }) {
  const mates = candidate.runningMates
    .map((m) => ({ ...m, label: runningMateLabel(office.key, m.role) }))
    .filter((m): m is typeof m & { label: string } => m.label !== null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="urna__candidate">
      <div className="urna__line">
        <div>Nome: {candidate.ballotName}</div>
        <div>Partido: {candidate.party.acronym}</div>
        {mates.map((m) => (
          <div key={m.role}>{m.label}: {m.ballotName}</div>
        ))}
      </div>
      <div className="urna__photos">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={candidate.photoUrl} alt="" className="urna__photo urna__photo--main" onError={hideBroken} />
        {mates.filter((m) => m.photoUrl).map((m) => (
          <div key={m.role}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.photoUrl} alt="" className="urna__photo urna__photo--mate" onError={hideBroken} />
            <div className="urna__photo-cap">{runningMateShort(m.role)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Lint**

Run: `pnpm exec eslint src/components/urna`
Expected: sem saída (0 problemas).

- [ ] **Step 4: Commit**

```bash
git add src/components/urna/DigitBoxes.tsx src/components/urna/CandidatePanel.tsx
git commit -m "urna: DigitBoxes e CandidatePanel (apresentação pura)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: `UrnaScreen` — as sete telas

**Files:**
- Create: `src/components/urna/UrnaScreen.tsx`

- [ ] **Step 1: Criar `UrnaScreen.tsx`**

```tsx
import type { ScreenView } from "./screen-view";
import { DigitBoxes } from "./DigitBoxes";
import { CandidatePanel } from "./CandidatePanel";

const BAR_CONFIRM = "Aperte a tecla:\n  VERDE para CONFIRMAR este voto\n  LARANJA para REINICIAR este voto";
const BAR_TYPING = "Digite o número do candidato.\nPara votar em branco, aperte a tecla BRANCO.";
const BAR_IDLE = "Aperte a tecla VERDE para iniciar a simulação.";
const BAR_INVALID = "Aperte a tecla LARANJA para corrigir.";

function Bar({ text, alert = false }: { text: string; alert?: boolean }) {
  return <div className={"urna__bar" + (alert ? " urna__bar--alert" : "")}>{text}</div>;
}

/** Tela 4:3 da urna. Apresentação pura: recebe a view já derivada e a mensagem de bloqueio. */
export function UrnaScreen({ view, message }: { view: ScreenView; message?: string | null }) {
  const bar = (fallback: string) =>
    message ? <Bar text={message} alert /> : <Bar text={fallback} />;

  return (
    <div className="urna__bezel">
      <div className="urna__screen">
        <div className="urna__screen-inner" key={view.kind}>
          {view.kind === "idle" && (
            <>
              <div className="urna__center" style={{ paddingBottom: "10%" }}>
                SIMULADOR DE VOTAÇÃO
                <br />
                2026
                <div style={{ fontSize: "0.6em", fontWeight: 400, marginTop: "1em" }}>
                  {view.stateName ? <>Estado: <b>{view.stateName}</b></> : "Escolha seu estado"}
                </div>
              </div>
              <Bar text={BAR_IDLE} />
            </>
          )}

          {view.kind === "typing" && (
            <>
              <div className="urna__title">SEU VOTO PARA</div>
              <div className="urna__office">{view.office.label}</div>
              <DigitBoxes digits={view.digits} total={view.office.digits} />
              {bar(BAR_TYPING)}
            </>
          )}

          {view.kind === "candidate" && (
            <>
              <div className="urna__title">SEU VOTO PARA</div>
              <div className="urna__office">{view.office.label}</div>
              <DigitBoxes digits={view.digits} total={view.office.digits} />
              <CandidatePanel candidate={view.candidate} office={view.office} />
              {bar(BAR_CONFIRM)}
            </>
          )}

          {view.kind === "null" && (
            <>
              <div className="urna__title">SEU VOTO PARA</div>
              <div className="urna__office">{view.office.label}</div>
              <DigitBoxes digits={view.digits} total={view.office.digits} />
              <div className="urna__center">
                NÚMERO ERRADO
                <br />
                VOTO NULO
              </div>
              {bar(BAR_CONFIRM)}
            </>
          )}

          {view.kind === "invalid" && (
            <>
              <div className="urna__title">SEU VOTO PARA</div>
              <div className="urna__office">{view.office.label}</div>
              <DigitBoxes digits={view.digits} total={view.office.digits} />
              <div className="urna__center">NÚMERO NÃO CADASTRADO</div>
              {bar(BAR_INVALID)}
            </>
          )}

          {view.kind === "blank" && (
            <>
              <div className="urna__title">SEU VOTO PARA</div>
              <div className="urna__office">{view.office.label}</div>
              <div className="urna__center">VOTO EM BRANCO</div>
              {bar(BAR_CONFIRM)}
            </>
          )}

          {view.kind === "finished" && (
            <>
              <div className="urna__fim">FIM</div>
              <div className="urna__bar urna__bar--muted">
                Simulação encerrada. Nenhum voto foi gravado ou enviado.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

Observação: `key={view.kind}` remonta `.urna__screen-inner` a cada troca de tela, o que dispara a animação `urna-fade` (150 ms; desligada com reduced-motion pelo CSS).

- [ ] **Step 2: Lint**

Run: `pnpm exec eslint src/components/urna`
Expected: 0 problemas.

- [ ] **Step 3: Commit**

```bash
git add src/components/urna/UrnaScreen.tsx
git commit -m "urna: UrnaScreen com as sete telas (espera, digitando, candidato, nulo, inválido, branco, FIM)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: `UrnaKeypad`

**Files:**
- Create: `src/components/urna/UrnaKeypad.tsx`

- [ ] **Step 1: Criar `UrnaKeypad.tsx`**

```tsx
"use client";

export type KeyId = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "BRANCO" | "CORRIGE" | "CONFIRMA";

const DIGITS: KeyId[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

interface Props {
  onDigit: (d: string) => void;
  onBlank: () => void;
  onCorrect: () => void;
  onConfirm: () => void;
  confirmEnabled: boolean;
  /** Tecla a destacar como pressionada (usada quando o teclado físico é acionado). */
  pressedKey?: KeyId | null;
  /** Só para o modo exibição da landing: sem foco, sem clique, invisível para leitor de tela. */
  decorative?: boolean;
}

/** Painel preto com teclas em relevo. Controlado: não guarda estado. */
export function UrnaKeypad({ onDigit, onBlank, onCorrect, onConfirm, confirmEnabled, pressedKey = null, decorative = false }: Props) {
  const common = decorative ? { tabIndex: -1, "aria-hidden": true as const } : {};
  const cls = (id: KeyId, extra = "") =>
    "urna-key" + extra + (pressedKey === id ? " urna-key--pressed" : "");

  return (
    <div className="urna__panel" role={decorative ? undefined : "group"} aria-label={decorative ? undefined : "Teclado da urna"}>
      <div className="urna__panel-label">SIMULADOR</div>
      <div className="urna__keys">
        {DIGITS.map((d) => (
          <button
            key={d}
            type="button"
            className={cls(d, d === "0" ? " urna-key--zero" : "")}
            aria-label={`Tecla ${d}`}
            onClick={() => onDigit(d)}
            {...common}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="urna__fn">
        <button type="button" className={cls("BRANCO", " urna-key--fn urna-key--branco")} aria-label="Branco" onClick={onBlank} {...common}>
          BRANCO
        </button>
        <button type="button" className={cls("CORRIGE", " urna-key--fn urna-key--corrige")} aria-label="Corrige" onClick={onCorrect} {...common}>
          CORRIGE
        </button>
        <button
          type="button"
          className={cls("CONFIRMA", " urna-key--fn urna-key--confirma")}
          aria-label="Confirma"
          aria-disabled={!confirmEnabled}
          onClick={onConfirm}
          {...common}
        >
          CONFIRMA
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `pnpm exec eslint src/components/urna`
Expected: 0 problemas.

- [ ] **Step 3: Commit**

```bash
git add src/components/urna/UrnaKeypad.tsx
git commit -m "urna: UrnaKeypad com teclas em relevo, BRANCO/CORRIGE/CONFIRMA e modo decorativo

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: `UrnaShell`

**Files:**
- Create: `src/components/urna/UrnaShell.tsx`

- [ ] **Step 1: Criar `UrnaShell.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import { UrnaKeypad } from "./UrnaKeypad";

const noop = () => {};

interface Props {
  screen: ReactNode;
  /** Teclado interativo. Omitido → teclado decorativo (landing). */
  keypad?: ReactNode;
  size?: "full" | "display";
}

/** Corpo físico da urna: base bege, moldura da tela, painel do teclado e ranhuras.
 *  Não conhece estado de votação. */
export function UrnaShell({ screen, keypad, size = "full" }: Props) {
  return (
    <div className={"urna" + (size === "display" ? " urna--display" : "")} aria-hidden={size === "display" ? true : undefined}>
      {screen}
      {keypad ?? (
        <UrnaKeypad onDigit={noop} onBlank={noop} onCorrect={noop} onConfirm={noop} confirmEnabled decorative />
      )}
      <div className="urna__vents" aria-hidden>
        {Array.from({ length: 9 }, (_, n) => <i key={n} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint e build**

Run: `pnpm exec eslint src/components/urna && pnpm build 2>&1 | tail -3`
Expected: 0 problemas; `✓ Compiled successfully`.

- [ ] **Step 3: Commit**

```bash
git add src/components/urna/UrnaShell.tsx
git commit -m "urna: UrnaShell (corpo físico, modo full e display)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Chunk 2: Contêiner, páginas e remoção do legado

### Task 8: `ProgressStrip` e `SoundToggle`

**Files:**
- Create: `src/components/urna/ProgressStrip.tsx`
- Create: `src/components/urna/SoundToggle.tsx`

- [ ] **Step 1: Criar `ProgressStrip.tsx`**

```tsx
import type { OfficeConfig } from "@/domain/voting/types";

interface Props {
  offices: OfficeConfig[];
  currentIndex: number;
  finished?: boolean;
}

/** Linha fina acima da urna com os cargos. Desktop: lista; celular: "Cargo n de N" + barra. */
export function ProgressStrip({ offices, currentIndex, finished = false }: Props) {
  const total = offices.length;
  const step = finished ? total : currentIndex + 1;
  return (
    <nav aria-label="Progresso da votação" className="w-full max-w-[980px]">
      <ol className="hidden flex-wrap items-center gap-x-3 gap-y-1 text-xs md:flex">
        {offices.map((o, i) => {
          const done = finished || i < currentIndex;
          const active = !finished && i === currentIndex;
          return (
            <li
              key={o.key}
              aria-current={active ? "step" : undefined}
              className={[
                "rounded-full px-2.5 py-1",
                done ? "bg-emerald-700 text-white" : "",
                active ? "bg-slate-900 font-semibold text-white dark:bg-white dark:text-slate-900" : "",
                !done && !active ? "bg-slate-300/70 text-slate-700 dark:bg-slate-700 dark:text-slate-300" : "",
              ].join(" ")}
            >
              {o.label}
            </li>
          );
        })}
      </ol>
      <div className="md:hidden">
        <p className="text-xs text-slate-600 dark:text-slate-300">Cargo {step} de {total}</p>
        <div
          className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-300/70 dark:bg-slate-700"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`Cargo ${step} de ${total}`}
        >
          <div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${(step / total) * 100}%` }} />
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Criar `SoundToggle.tsx`**

```tsx
"use client";

import { useEffect, useSyncExternalStore } from "react";
import { isMuted, setMuted, subscribeMuted } from "@/lib/audio";

const KEY = "legisurna:muted";
const serverSnapshot = () => false;

/** Botão de mudo. O módulo de áudio é a única fonte de verdade (useSyncExternalStore);
 *  o localStorage é lido só depois da hidratação. */
export function SoundToggle() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, serverSnapshot);

  useEffect(() => {
    try {
      setMuted(window.localStorage.getItem(KEY) === "1");
    } catch {
      // localStorage indisponível: fica desmutado
    }
  }, []);

  function toggle() {
    const next = !muted;
    setMuted(next);
    try {
      window.localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      // sem persistência, sem erro
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={muted}
      className="min-h-12 rounded-full border border-slate-400/60 bg-white/70 px-4 text-sm font-medium text-slate-800 backdrop-blur hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-800"
    >
      {muted ? "Som: desligado" : "Som: ligado"}
    </button>
  );
}
```

- [ ] **Step 3: Lint**

Run: `pnpm exec eslint src/components/urna`
Expected: 0 problemas.

- [ ] **Step 4: Commit**

```bash
git add src/components/urna/ProgressStrip.tsx src/components/urna/SoundToggle.tsx
git commit -m "urna: ProgressStrip e SoundToggle

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: `UrnaVoting` (contêiner) e `VotingMachine`

**Files:**
- Create: `src/components/urna/UrnaVoting.tsx`
- Modify: `src/components/voting/VotingMachine.tsx`

- [ ] **Step 1: Criar `UrnaVoting.tsx`**

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useVotingSession } from "@/stores/voting-session";
import { currentOffice } from "@/domain/voting/rules";
import { STATES } from "@/data/states";
import { track } from "@/lib/analytics";
import { sfx } from "@/lib/audio";
import { toScreenView } from "./screen-view";
import { UrnaShell } from "./UrnaShell";
import { UrnaScreen } from "./UrnaScreen";
import { UrnaKeypad, type KeyId } from "./UrnaKeypad";
import { ProgressStrip } from "./ProgressStrip";

const FLASH_MS = 120;

/** Único componente da pasta que fala com o store. Guarda dois estados de UI:
 *  `started` (tela de espera) e `pressedKey` (destaque da tecla no teclado físico). */
export function UrnaVoting({ stateCode }: { stateCode: string }) {
  // `stateCode` vem por prop (não do store) para o "Estado: …" da tela de espera não piscar "SP"
  // no SSR enquanto o init() ainda não rodou.
  const {
    offices, currentIndex, digits, status, foundCandidate, message,
    pressDigit, pressBlank, pressCorrect, confirm, restart, isConfirmEnabled,
  } = useVotingSession();

  const [started, setStarted] = useState(false);
  const [pressedKey, setPressedKey] = useState<KeyId | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const office = currentOffice(offices, currentIndex);
  const stateName = STATES.find((s) => s.code === stateCode)?.name ?? null;
  const finished = status === "FINISHED";
  const view = toScreenView({ started, stateName, status, office, digits, foundCandidate });

  const flash = useCallback((k: KeyId) => {
    setPressedKey(k);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setPressedKey(null), FLASH_MS);
  }, []);
  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  // --- ações (compartilhadas entre teclado virtual e físico) ---
  const onDigit = useCallback((d: string) => {
    if (finished) return;
    sfx.digit();
    if (!started) return;
    pressDigit(d);
  }, [finished, started, pressDigit]);

  const onBlank = useCallback(() => {
    if (finished) return;
    if (!started) { sfx.digit(); return; }
    sfx.blank();
    pressBlank();
    track("blank_flow_used", { office: office?.key ?? "" });
  }, [finished, started, pressBlank, office?.key]);

  const onCorrect = useCallback(() => {
    if (finished) return;
    if (!started) { sfx.digit(); return; }
    sfx.correct();
    pressCorrect();
    track("correction_used", { office: office?.key ?? "" });
  }, [finished, started, pressCorrect, office?.key]);

  const onConfirm = useCallback(() => {
    if (finished) return;
    if (!started) {
      setStarted(true);
      sfx.confirm();
      track("simulation_started", { state: stateCode, mode: "completo" });
      return;
    }
    const r = confirm();
    if (r !== "ok") { sfx.error(); return; }
    const nowFinished = useVotingSession.getState().status === "FINISHED";
    if (nowFinished) {
      sfx.fim();
      track("simulation_completed", { state: stateCode, total_offices: offices.length });
    } else {
      sfx.confirm();
      track("office_completed", { office: office?.key ?? "", index: currentIndex + 1 });
    }
  }, [finished, started, confirm, stateCode, offices.length, office?.key, currentIndex]);

  const onRestart = useCallback(() => {
    restart();
    setStarted(false);
  }, [restart]);

  // --- teclado físico ---
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (finished) return; // Enter/Espaço devem continuar ativando os botões abaixo da urna
      if (e.ctrlKey || e.metaKey || e.altKey) return; // atalhos do navegador (Cmd+B, Cmd+1…)
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      // Tecla virtual focada após um clique: só Enter/Espaço ficam com o botão; dígitos, B e Backspace seguem para a urna.
      if ((tag === "BUTTON" || tag === "A") && (e.key === "Enter" || e.key === " ")) return;
      if (e.key >= "0" && e.key <= "9") { flash(e.key as KeyId); onDigit(e.key); e.preventDefault(); return; }
      if (e.key === "Backspace" || e.key === "Escape") { flash("CORRIGE"); onCorrect(); e.preventDefault(); return; }
      if (e.key === "Enter") { flash("CONFIRMA"); onConfirm(); e.preventDefault(); return; }
      if (e.key.toLowerCase() === "b") { flash("BRANCO"); onBlank(); e.preventDefault(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, flash, onDigit, onCorrect, onConfirm, onBlank]);

  // --- leitor de tela ---
  const live =
    view.kind === "idle" ? "Urna pronta. Aperte Confirma para iniciar." :
    view.kind === "candidate" ? `Candidatura ${view.candidate.ballotName}, número ${view.candidate.number}` :
    view.kind === "null" ? "Número errado. Voto nulo. Confirme para gravar." :
    view.kind === "invalid" ? "Número não cadastrado. Aperte Corrige." :
    view.kind === "blank" ? "Voto em branco. Confirme para gravar." :
    view.kind === "finished" ? "Fim da votação." :
    "";

  return (
    <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col items-center gap-4 px-4 py-4">
      <ProgressStrip offices={offices} currentIndex={currentIndex} finished={finished} />
      <p className="sr-only" role="status" aria-live="assertive">{live}{message ? ` ${message}` : ""}</p>

      <UrnaShell
        screen={<UrnaScreen view={view} message={message} />}
        keypad={
          <UrnaKeypad
            onDigit={onDigit}
            onBlank={onBlank}
            onCorrect={onCorrect}
            onConfirm={onConfirm}
            confirmEnabled={!started || isConfirmEnabled()}
            pressedKey={pressedKey}
          />
        }
      />

      {finished && (
        <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
          <button type="button" onClick={onRestart} className="urna-key urna-key--fn urna-key--confirma flex-1 !text-base">
            Votar novamente
          </button>
          <Link href="/" className="urna-key urna-key--fn urna-key--branco flex flex-1 items-center justify-center !text-base">
            Sair
          </Link>
        </div>
      )}

      <p className="text-center text-xs text-slate-600 dark:text-slate-400">
        Teclado: números digitam · Backspace ou Esc = corrige · B = branco · Enter = confirma
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Reescrever `src/components/voting/VotingMachine.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useVotingSession } from "@/stores/voting-session";
import { FULL_OFFICES } from "@/domain/voting/rules";
import type { Candidate } from "@/domain/voting/types";
import { DisclaimerBanner } from "@/components/ui/Disclaimer";
import { UrnaVoting } from "@/components/urna/UrnaVoting";
import { SoundToggle } from "@/components/urna/SoundToggle";

export function VotingMachine({ stateCode, candidates, offices = FULL_OFFICES }: {
  stateCode: string;
  candidates: Candidate[];
  offices?: typeof FULL_OFFICES;
}) {
  const init = useVotingSession((s) => s.init);

  useEffect(() => {
    init(stateCode, candidates, offices, true);
  }, [init, stateCode, candidates, offices]);

  return (
    <>
      <DisclaimerBanner className="mx-auto mt-3 w-full max-w-[980px] rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-center text-[0.7rem] font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" />
      <UrnaVoting stateCode={stateCode} />
      <div className="mx-auto mb-6 flex w-full max-w-[980px] justify-center px-4">
        <SoundToggle />
      </div>
    </>
  );
}
```

Nota: `track("simulation_started")` saiu do `mount` e agora dispara no primeiro CONFIRMA (dentro de `UrnaVoting`), conforme a spec 4.8.

- [ ] **Step 3: Lint e build**

Run: `pnpm exec eslint src && pnpm build 2>&1 | tail -3`
Expected: 0 problemas; `✓ Compiled successfully`. (`VotingScreen` ainda existe mas não é mais importado; será removido na Task 10.)

- [ ] **Step 4: Commit**

```bash
git add src/components/urna/UrnaVoting.tsx src/components/voting/VotingMachine.tsx
git commit -m "urna: UrnaVoting (contêiner com tela de espera, FIM na urna, teclado físico) e VotingMachine

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Remover legado (rota `/fim` e componentes antigos)

**Files:**
- Delete: `src/app/simular/[uf]/fim/page.tsx`
- Delete: `src/components/voting/VotingScreen.tsx`
- Delete: `src/components/voting/NumericKeypad.tsx`
- Delete: `src/components/voting/CandidateCard.tsx`
- Delete: `src/components/voting/ProgressBar.tsx`

- [ ] **Step 1: Apagar**

```bash
git rm -q "src/app/simular/[uf]/fim/page.tsx" src/components/voting/VotingScreen.tsx src/components/voting/NumericKeypad.tsx src/components/voting/CandidateCard.tsx src/components/voting/ProgressBar.tsx
```

- [ ] **Step 2: Confirmar que nada mais referencia o que foi apagado**

Run: `grep -rn "VotingScreen\|NumericKeypad\|CandidateCard\|ProgressBar\|push(\"fim\")\|/fim" src tests .claude/checkup.sh`
Expected: nenhuma linha. (`"fim"` sozinho não entra no padrão: é uma chave legítima de `sfx` em `tests/audio.test.ts`.) Se aparecer alguma, corrigir a referência antes de seguir.

- [ ] **Step 3: Lint, testes e build**

Run: `pnpm exec eslint src && pnpm test 2>&1 | tail -3 && pnpm build 2>&1 | grep -E "simular|✓ Compiled"`
Expected: 0 problemas; `35 passed`; a lista de rotas do build **não** contém `/simular/[uf]/fim`.

- [ ] **Step 4: Commit**

```bash
git commit -m "urna: remover rota /fim e componentes antigos (FIM agora dentro da urna)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Landing `/` com a urna em modo exibição

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Reescrever `src/app/page.tsx`**

```tsx
import Link from "next/link";
import { DisclaimerBanner } from "@/components/ui/Disclaimer";
import { UrnaShell } from "@/components/urna/UrnaShell";
import { UrnaScreen } from "@/components/urna/UrnaScreen";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-8 px-4 py-10 text-center">
      <DisclaimerBanner className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" />

      <UrnaShell size="display" screen={<UrnaScreen view={{ kind: "idle", stateName: null }} />} />

      <div className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-bold sm:text-4xl">Simulador de Votação 2026</h1>
        <p className="max-w-xl text-slate-700 dark:text-slate-300">
          Treine o fluxo de votação das Eleições Gerais de 2026 numa réplica da urna: digite o número, veja a
          candidatura, confirme. Ordem oficial de votação, do TSE.
        </p>
        <Link
          href="/simular"
          className="urna-key urna-key--fn urna-key--confirma flex min-h-16 w-full max-w-xs items-center justify-center !text-lg"
        >
          COMEÇAR SIMULAÇÃO
        </Link>
      </div>

      <ol className="grid gap-2 text-left text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
        <li>1. Deputado Federal (4 dígitos)</li>
        <li>2. Deputado Estadual ou Distrital (5 dígitos)</li>
        <li>3. Senador — 1ª vaga (3 dígitos)</li>
        <li>4. Senador — 2ª vaga (3 dígitos)</li>
        <li>5. Governador (2 dígitos)</li>
        <li>6. Presidente (2 dígitos)</li>
      </ol>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Sua escolha não é enviada a nenhum servidor. Nenhuma informação pessoal é registrada.
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Build**

Run: `pnpm build 2>&1 | tail -3`
Expected: `✓ Compiled successfully`, sem erro de fronteira server/client. O padrão é válido no Next 16: `page.tsx` (server) renderiza `UrnaShell` (client) e passa `UrnaScreen` como prop `screen`; `UrnaScreen` e `DigitBoxes` não têm `"use client"` nem handlers, e `CandidatePanel` já é client (por causa do `onError`). Se der erro, o problema é outro: ler a mensagem.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "landing: urna em modo exibição e CTA no estilo tecla

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: `/simular` e `/simular/[uf]` com o mesmo acabamento

**Files:**
- Modify: `src/app/simular/page.tsx`
- Modify: `src/app/simular/[uf]/page.tsx`

- [ ] **Step 1: Em `src/app/simular/page.tsx`, trocar só as classes dos cards de UF**

Substituir a `className` do `<Link>` dentro do `map` por:

```tsx
className="flex min-h-14 items-center justify-center rounded-lg border border-[color:var(--urna-body-dark)] bg-[color:var(--urna-body)] px-3 text-center text-sm font-semibold text-slate-900 shadow-[0_3px_0_var(--urna-body-dark)] transition hover:brightness-105 active:translate-y-[2px] active:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
```

E a cor do parágrafo de apoio: `text-slate-600 dark:text-slate-400` → `text-slate-700 dark:text-slate-300`.

- [ ] **Step 2: Em `src/app/simular/[uf]/page.tsx`, trocar o CTA "Iniciar votação"**

Substituir a `className` do primeiro `<Link>` (Iniciar votação) por:

```tsx
className="urna-key urna-key--fn urna-key--confirma flex min-h-16 w-full items-center justify-center !text-lg"
```

E o texto do link para `INICIAR VOTAÇÃO`.

- [ ] **Step 3: Em `src/app/layout.tsx`, remover as classes de fundo que ficaram mortas**

`body { background: var(--stage) }` (Task 1) vence as utilities. Trocar `className="flex min-h-full flex-col bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100"` por `className="flex min-h-full flex-col text-slate-900 antialiased dark:text-slate-100"`.

- [ ] **Step 4: Lint e build**

Run: `pnpm exec eslint src && pnpm build 2>&1 | tail -3`
Expected: 0 problemas; `✓ Compiled successfully`.

- [ ] **Step 5: Commit**

```bash
git add src/app/simular/page.tsx "src/app/simular/[uf]/page.tsx" src/app/layout.tsx
git commit -m "simular: cards de UF e CTA com o acabamento da urna; layout sem fundo morto

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Chunk 3: Checkup, verificação visual, deploy e documentação

### Task 13: Atualizar `.claude/checkup.sh`

**Files:**
- Modify: `.claude/checkup.sh`

- [ ] **Step 1: Substituir o bloco `-- tests --` e acrescentar as novas verificações**

Trocar a linha:
```bash
if pnpm test 2>&1 | tee /tmp/legisurna-checkup-test.log | grep -q "passed"; then pass "vitest 23 tests"; else fail "vitest"; fi
```
por:
```bash
if pnpm test 2>&1 | tee /tmp/legisurna-checkup-test.log | grep -qE "Tests +[0-9]+ passed" && ! grep -q "failed" /tmp/legisurna-checkup-test.log; then pass "vitest (todos passando)"; else fail "vitest"; fi
```

Inserir **antes** de `echo "-- aviso não oficial --"`:
```bash
echo "-- urna --"
for c in UrnaShell UrnaScreen UrnaKeypad CandidatePanel DigitBoxes ProgressStrip SoundToggle UrnaVoting; do
  if [ -f "src/components/urna/$c.tsx" ]; then pass "componente urna/$c"; else fail "componente urna/$c ausente"; fi
done
[ -f src/components/urna/screen-view.ts ] && pass "screen-view.ts" || fail "screen-view.ts ausente"
for t in "SEU VOTO PARA" "NÚMERO ERRADO" "VOTO EM BRANCO" "FIM"; do
  if grep -q "$t" src/components/urna/UrnaScreen.tsx; then pass "tela contém '$t'"; else fail "tela sem '$t'"; fi
done
if [ -e "src/app/simular/[uf]/fim" ]; then fail "rota /simular/[uf]/fim ainda existe"; else pass "rota /fim removida (FIM dentro da urna)"; fi
if [ -d src/components/urna ] && ! grep -rwiq "TSE\|Justiça Eleitoral\|brasão" src/components/urna; then pass "urna sem marca da Justiça Eleitoral"; else fail "componentes da urna ausentes ou mencionam TSE/Justiça Eleitoral/brasão"; fi
```

- [ ] **Step 2: Rodar o checkup**

Run: `bash .claude/checkup.sh 2>&1 | tail -40`
Expected: todas as linhas `PASS` e a última `== 0 FAIL — pronto para validar com cliente ==`.

- [ ] **Step 3: Commit**

```bash
git add .claude/checkup.sh
git commit -m "checkup: verificações da urna realista (componentes, textos da tela, rota /fim removida, sem marca TSE)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 14: Verificação visual local (seis telas, desktop e celular)

**Files:**
- Create: `docs/superpowers/specs/screenshots/` (PNGs)

Sem Playwright instalado no projeto. Usar o Chrome headless do sistema (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`) para screenshots automáticos das telas alcançáveis por URL (landing e tela de espera). As quatro telas que dependem de interação (digitando, candidato, nulo/branco, FIM) são conferidas por Domenico pelo roteiro do Step 4, e ele salva os screenshots delas na mesma pasta. **Desvio consciente em relação à spec §7.3** (que previa screenshots das seis telas gerados pelo executor): registrado na própria spec.

- [ ] **Step 1: Subir o dev server**

Run: `pnpm dev --port 3100 > /tmp/legisurna-dev.log 2>&1 &` e aguardar com `curl -s -o /dev/null --retry 30 --retry-connrefused --retry-delay 1 http://localhost:3100/ && echo pronto` (sem `sleep` em foreground).
Expected: `pronto`.

- [ ] **Step 2: Screenshots da landing e da tela de espera (1280 px e 390 px)**

```bash
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT=docs/superpowers/specs/screenshots; mkdir -p "$OUT"
# 1280: barras de rolagem ocultas. 390: mantidas de propósito, para uma rolagem horizontal aparecer no PNG.
"$CH" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --window-size=1280,1100 --screenshot="$OUT/landing-1280.png" http://localhost:3100/ 2>/dev/null
"$CH" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --window-size=1280,1100 --screenshot="$OUT/espera-1280.png" http://localhost:3100/simular/SP/votar 2>/dev/null
"$CH" --headless=new --disable-gpu --virtual-time-budget=5000 --window-size=390,1100 --screenshot="$OUT/landing-390.png" http://localhost:3100/ 2>/dev/null
"$CH" --headless=new --disable-gpu --virtual-time-budget=5000 --window-size=390,1100 --screenshot="$OUT/espera-390.png" http://localhost:3100/simular/SP/votar 2>/dev/null
ls -la "$OUT"
```
Expected: 4 PNGs > 20 KB cada.

- [ ] **Step 3: Inspecionar os PNGs com a ferramenta Read (imagem) e confirmar**

Checklist (corrigir CSS e repetir se falhar):
- Landing 1280: urna bege com tela clara mostrando "SIMULADOR DE VOTAÇÃO 2026 / Escolha seu estado", painel escuro com teclas e BRANCO/CORRIGE/CONFIRMA, ranhuras na base, CTA verde abaixo.
- Landing 390: urna empilhada (tela em cima, teclado embaixo), sem rolagem horizontal.
- Espera 1280: linha de progresso acima, urna com "Estado: São Paulo", barra "Aperte a tecla VERDE para iniciar a simulação.", botão de som abaixo.
- Espera 390: "Cargo 1 de 6" + barra; teclas ≥ 48 px.

- [ ] **Step 4: Conferência interativa (Domenico, no navegador em http://localhost:3100/simular/SP/votar)**

Roteiro a enviar para Domenico, uma linha por tela. Pedir que salve um screenshot de cada tela (DevTools → Capture screenshot, em 1280 e no modo dispositivo 390) em `docs/superpowers/specs/screenshots/` com os nomes `digitando-<w>.png`, `candidato-<w>.png`, `nulo-<w>.png`, `branco-<w>.png`, `fim-<w>.png`:
1. CONFIRMA → tela "SEU VOTO PARA / Deputado Federal" com 4 caixas vazias.
2. Digitar 1055 → foto e nome do MILTON VIEIRA, barra "VERDE para CONFIRMAR".
3. CORRIGE → caixas vazias de novo. Digitar 9999 → "NÚMERO ERRADO / VOTO NULO".
4. CORRIGE, BRANCO → "VOTO EM BRANCO". CONFIRMA → próximo cargo.
5. Seguir até Presidente (22) e CONFIRMA → "FIM" na tela, som longo, botões "Votar novamente" e "Sair" abaixo.
6. Enter no botão "Votar novamente" focado → volta para a tela de espera.
7. Teclado físico: digitar acende a tecla no painel; botão de som desliga os beeps.

- [ ] **Step 5: Parar o dev server e commitar os screenshots**

```bash
pgrep -fl "next dev --port 3100"; pkill -f "next dev --port 3100"; sleep 1; pgrep -fl next || echo "dev server parado"
echo "docs" >> .dockerignore   # screenshots não entram no contexto de build
git add .dockerignore docs/superpowers/specs/screenshots
git commit -m "docs: screenshots da urna realista (landing e tela de espera, 1280/390)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 15: Deploy em produção e smoke

Procedimento registrado na memória `legisurna-deploy` e no Obsidian. VPS BI = `ssh vps2`.

- [x] **Step 1: Push (HTTPS via gh — a chave SSH é deploy key só de leitura) e conferir**

```bash
git -c credential.helper='!gh auth git-credential' push https://github.com/osvaldodomenico/legisUrna.git main
git fetch -q origin && git status -sb | head -1
```
Expected: `## main...origin/main` (sem `ahead`).

- [x] **Step 2: Build na VPS BI com limite de memória**

```bash
SHA=$(git rev-parse --short HEAD)
ssh vps2 "cd /opt/legisurna && git fetch -q origin && git reset -q --hard origin/main && git log --oneline -1 && DOCKER_BUILDKIT=0 docker build --memory=3g --memory-swap=3g -t legisurna:$SHA . 2>&1 | tail -3 && free -h | sed -n 2p"
```
Expected: `Successfully tagged legisurna:<sha>`; RAM usada ≈ 5 GB.

- [x] **Step 3: Registrar a tag em produção (rollback) e trocar o container (mesmas labels do Traefik)**

```bash
ssh vps2 "docker inspect legisurna --format '{{.Config.Image}}'; docker images legisurna --format '{{.Repository}}:{{.Tag}}'"
```
Expected: a imagem atual (ex.: `legisurna:4f127ce`) aparece nas duas listas. **Anotar essa tag: é a de rollback.** Se não aparecer em `docker images`, parar e avisar.

```bash
SHA=$(git rev-parse --short HEAD)   # cada chamada de shell é nova: redefinir aqui
ssh vps2 "docker rm -f legisurna && docker run -d --name legisurna --restart unless-stopped --memory 512m --network easypanel \
 -l traefik.enable=true -l traefik.docker.network=easypanel \
 -l 'traefik.http.routers.legisurna-http.entrypoints=http' \
 -l 'traefik.http.routers.legisurna-http.rule=Host(\`simulador.shiftlegis.com.br\`)' \
 -l 'traefik.http.routers.legisurna-http.middlewares=redirect-to-https@file' \
 -l 'traefik.http.routers.legisurna-http.service=legisurna' \
 -l 'traefik.http.routers.legisurna.entrypoints=https' \
 -l 'traefik.http.routers.legisurna.rule=Host(\`simulador.shiftlegis.com.br\`)' \
 -l 'traefik.http.routers.legisurna.tls=true' \
 -l 'traefik.http.routers.legisurna.tls.certresolver=letsencrypt' \
 -l 'traefik.http.routers.legisurna.service=legisurna' \
 -l 'traefik.http.services.legisurna.loadbalancer.server.port=3000' \
 legisurna:$SHA && sleep 5 && docker ps --filter name=legisurna --format '{{.Status}}'"
```
Expected: `Up 5 seconds`.

- [x] **Step 4: Smoke em produção**

```bash
for p in / /simular /simular/SP /simular/SP/votar /como-funciona /privacidade /termos /simular/SP/fim; do
  echo "$p $(/usr/bin/curl -s -o /dev/null -w '%{http_code}' -m 20 https://simulador.shiftlegis.com.br$p)"; done
/usr/bin/curl -s https://simulador.shiftlegis.com.br/ | grep -c "SIMULAÇÃO NÃO OFICIAL"
/usr/bin/curl -s https://simulador.shiftlegis.com.br/simular/SP/votar | grep -o '<meta name="robots"[^>]*>'
/usr/bin/curl -s https://simulador.shiftlegis.com.br/ | grep -c "urna__panel-label"
```
Expected: todas 200 exceto `/simular/SP/fim` → 404; contagem do aviso ≥ 1; `noindex, nofollow`; `urna__panel-label` ≥ 1 (a urna renderizou na landing).

Rollback, se algo falhar: mesmo `docker run` do Step 3 com a **tag anotada no início do Step 3** escrita literalmente no lugar de `legisurna:$SHA` (não depender de variável).

---

### Task 16: Documentação (Obsidian + memória)

**Files:**
- Modify: `…/shiftworks_brain/01 - Projetos Ativos/LegisUrna/05 - Historico de Mudancas.md`
- Modify: `…/shiftworks_brain/01 - Projetos Ativos/LegisUrna/02 - Arquitetura.md`
- Modify: `…/shiftworks_brain/01 - Projetos Ativos/LegisUrna/03 - Backlog.md`
- Modify: `~/.claude/projects/-Users-domenico-Downloads-sistemas-LegisUrna/memory/legisurna-deploy.md` (e cópia em `~/.claude-lobo/...`)

- [x] **Step 1: Histórico** — acrescentar entrada "2026-09-26 — Interface urna realista (réplica visual)" com: direção A escolhida via visual companion; componentes em `src/components/urna/`; FIM dentro da urna e rota `/fim` removida; tela de espera; som do FIM + mudo; `simulation_started` no primeiro CONFIRMA; testes 23 → N (usar o total que `pnpm test` imprimir); tag de deploy `legisurna:<sha>`; smoke OK.

- [x] **Step 2: Arquitetura** — na seção "Engine de votação", trocar `components/voting/ — VotingMachine, VotingScreen, NumericKeypad, CandidateCard, ProgressBar` por `components/voting/VotingMachine` + `components/urna/{UrnaShell,UrnaScreen,DigitBoxes,CandidatePanel,UrnaKeypad,ProgressStrip,SoundToggle,UrnaVoting,screen-view}` e em "Rotas" remover `/simular/[uf]/fim`.

- [x] **Step 3: Backlog** — adicionar em Fase 1 (ou nova linha "Fase 1b — UI urna realista ✅ 2026-09-26") e um item pendente: "Fotos de vice/suplentes + candidatos de exemplo (Domenico envia)".

- [x] **Step 4: Memória** — em `legisurna-deploy.md`, atualizar a tag em produção e acrescentar `[[legisurna-ui-urna]]`; criar `legisurna-ui-urna.md` (type: project) com: direção A realista escolhida em 2026-09-26; toda a aparência em `src/styles/urna.css`; a única ponte com o store é `UrnaVoting`; `toScreenView` é pura e testada; não usar brasão/TSE dentro de `components/urna` (checkup falha). Atualizar `MEMORY.md` e copiar para `~/.claude-lobo/.../memory/`.

- [x] **Step 5: Encerrar o visual companion**

Run: `/Users/domenico/.claude/plugins/cache/superpowers-marketplace/superpowers/5.0.2/skills/brainstorming/scripts/stop-server.sh /Users/domenico/Downloads/sistemas/LegisUrna/.superpowers/brainstorm/98701-1790472651`
