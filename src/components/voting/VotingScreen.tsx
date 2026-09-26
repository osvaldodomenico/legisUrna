"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVotingSession } from "@/stores/voting-session";
import { currentOffice } from "@/domain/voting/rules";
import { track } from "@/lib/analytics";
import { sfx } from "@/lib/audio";
import { NumericKeypad } from "./NumericKeypad";
import { ProgressBar } from "./ProgressBar";
import { CandidateCard } from "./CandidateCard";

export function VotingScreen() {
  const router = useRouter();
  const {
    offices, currentIndex, digits, status, foundCandidate, message, enableNull,
    pressDigit, pressBlank, pressCorrect, confirm, isConfirmEnabled,
  } = useVotingSession();

  const office = currentOffice(offices, currentIndex);
  const confirmEnabled = isConfirmEnabled();

  const onConfirm = useCallback(() => {
    const r = confirm();
    if (r === "ok") { sfx.confirm(); track("office_completed", { office: office?.key ?? "", index: currentIndex + 1 }); }
    else sfx.error();
  }, [confirm, office?.key, currentIndex]);

  // Teclado físico
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key >= "0" && e.key <= "9") { pressDigit(e.key); sfx.digit(); e.preventDefault(); return; }
      if (e.key === "Backspace" || e.key === "Escape") { pressCorrect(); sfx.correct(); e.preventDefault(); return; }
      if (e.key === "Enter") { onConfirm(); e.preventDefault(); return; }
      if (e.key.toLowerCase() === "b") { pressBlank(); sfx.blank(); e.preventDefault(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pressDigit, pressCorrect, pressBlank, onConfirm]);

  // Avança para /fim ao concluir
  useEffect(() => {
    if (status === "FINISHED") {
      track("simulation_completed", { total_offices: offices.length });
      router.push("fim");
    }
  }, [status, offices.length, router]);

  // Mensagens para leitor de tela
  const live =
    status === "CANDIDATE_FOUND" ? `Candidatura ${foundCandidate?.ballotName}, número ${foundCandidate?.number}` :
    status === "INVALID_NUMBER" ? "Número não cadastrado" :
    status === "BLANK_PENDING" ? "Voto em branco. Confirme para gravar." :
    status === "CONFIRM_READY" ? "Voto anulado por número não cadastrado. Confirme para gravar." :
    "";

  if (!office) return null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-4">
      <ProgressBar offices={offices} currentIndex={currentIndex} />

      <h1 className="text-center text-lg font-semibold text-slate-900 dark:text-slate-50">{office.label}</h1>

      <div
        role="status"
        aria-live="assertive"
        className="flex min-h-20 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-4xl font-bold tracking-[0.3em] text-slate-900 dark:border-slate-700 dark:text-slate-50"
      >
        {digits || "–".repeat(office.digits)}
      </div>

      <p className="sr-only">{live}</p>

      {foundCandidate && <CandidateCard candidate={foundCandidate} office={office} />}

      {status === "INVALID_NUMBER" && (
        <p className="rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          NÚMERO NÃO CADASTRADO. Use CORRIGE para digitar outro número.
        </p>
      )}

      {status === "BLANK_PENDING" && (
        <p className="rounded-lg bg-slate-100 p-3 text-center text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-200">
          Voto em branco. Pressione CONFIRMA para gravar ou CORRIGE para voltar.
        </p>
      )}

      {status === "CONFIRM_READY" && (
        <p className="rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          VOTO ANULADO — o número digitado não consta na urna. Pressione CONFIRMA para gravar como anulado, ou CORRIGE.
        </p>
      )}

      {message && <p className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{message}</p>}

      <NumericKeypad onDigit={(d) => { pressDigit(d); sfx.digit(); }} onCorrect={() => { pressCorrect(); sfx.correct(); track("correction_used", { office: office.key }); }} onBlank={() => { pressBlank(); sfx.blank(); track("blank_flow_used", { office: office.key }); }} />

      <button
        type="button"
        onClick={onConfirm}
        disabled={!confirmEnabled}
        className="min-h-14 w-full rounded-lg bg-emerald-600 text-lg font-semibold text-white transition enabled:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:enabled:hover:bg-emerald-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
      >
        CONFIRMA
      </button>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Teclado: números digitam · Backspace ou Esc = corrige · B = branco · Enter = confirma
        {enableNull ? "" : " · voto anulado desativado"}
      </p>
    </div>
  );
}
