"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useVotingSession } from "@/stores/voting-session";
import { currentOffice } from "@/domain/voting/rules";
import { STATES } from "@/data/states";
import { track } from "@/lib/analytics";
import { FIM_MS, sfx } from "@/lib/audio";
import { enviarSimulacao } from "@/lib/apuracao/enviar";
import { ColinhaModal } from "@/components/colinha/Colinha";
import { BuscaCandidato } from "@/components/busca/BuscaCandidato";
import { montarColinha } from "@/components/colinha/linhas";
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
    offices, currentIndex, digits, status, foundCandidate, message, votes, candidates,
    pressDigit, pressBlank, pressCorrect, confirm, restart, isConfirmEnabled,
  } = useVotingSession();

  const [started, setStarted] = useState(false);
  const [pressedKey, setPressedKey] = useState<KeyId | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartButtonRef = useRef<HTMLButtonElement | null>(null);
  // A colinha abre em modal só quando o jingle do FIM termina. O convite de contato
  // (ContatoCard) está fora por decisão do Domenico em 2026-10-01.
  const [colinha, setColinha] = useState(false);
  const [busca, setBusca] = useState(false);
  const colinhaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const office = currentOffice(offices, currentIndex);
  // Estável entre renderizações: o modal só redesenha a imagem quando os votos mudam.
  const linhasColinha = useMemo(() => montarColinha(offices, votes, candidates), [offices, votes, candidates]);
  const stateName = STATES.find((s) => s.code === stateCode)?.name ?? null;
  const finished = started && status === "FINISHED";
  const view = toScreenView({ started, stateName, status, office, digits, foundCandidate });

  const flash = useCallback((k: KeyId) => {
    setPressedKey(k);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setPressedKey(null), FLASH_MS);
  }, []);
  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    if (colinhaTimer.current) clearTimeout(colinhaTimer.current);
  }, []);
  useEffect(() => { if (finished) restartButtonRef.current?.focus(); }, [finished]);

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
      colinhaTimer.current = setTimeout(() => setColinha(true), FIM_MS);
      track("simulation_completed", { state: stateCode, total_offices: offices.length });
      enviarSimulacao(stateCode, useVotingSession.getState().votes);
    } else {
      sfx.confirm();
      track("office_completed", { office: office?.key ?? "", index: currentIndex + 1 });
    }
  }, [finished, started, confirm, stateCode, offices.length, office?.key, currentIndex]);

  // Busca por nome: digita o número escolhido do zero, como se a pessoa tivesse teclado.
  const onEscolher = useCallback((numero: string) => {
    setBusca(false);
    pressCorrect();
    for (const d of numero) pressDigit(d);
    sfx.digit();
  }, [pressCorrect, pressDigit]);

  const onRestart = useCallback(() => {
    restart();
    setStarted(false);
    if (colinhaTimer.current) clearTimeout(colinhaTimer.current);
    setColinha(false);
  }, [restart]);

  // --- teclado físico ---
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat) return;
      if (busca) return; // o modal de busca cuida das próprias teclas
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
  }, [busca, finished, flash, onDigit, onCorrect, onConfirm, onBlank]);

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
      <p className="sr-only" role="alert">{live}{message ? ` ${message}` : ""}</p>

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

      {started && !finished && office && (
        <button type="button" onClick={() => setBusca(true)} className="urna-key urna-key--fn urna-key--branco w-full max-w-md !text-base">
          Não sabe o número? Buscar pelo nome
        </button>
      )}

      {busca && office && !finished && (
        <BuscaCandidato office={office} candidates={candidates} onEscolher={onEscolher} onClose={() => setBusca(false)} />
      )}

      {finished && colinha && (
        <ColinhaModal linhas={linhasColinha} onClose={() => setColinha(false)} />
      )}

      {finished && (
        <button type="button" onClick={() => setColinha(true)} className="urna-key urna-key--fn urna-key--branco w-full max-w-md !text-base">
          Ver minha colinha
        </button>
      )}

      {finished && (
        <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
          <button ref={restartButtonRef} type="button" onClick={onRestart} className="urna-key urna-key--fn urna-key--confirma flex-1 !text-base">
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
