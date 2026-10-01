"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Candidate, OfficeConfig } from "@/domain/voting/types";
import { filtrarCandidatos } from "./filtrar";

/** Busca por nome, partido ou número no cargo da vez, em `<dialog>` nativo.
 *  Escolher um candidato devolve o número para a urna digitar; o voto ainda precisa do CONFIRMA. */
export function BuscaCandidato({ office, candidates, onEscolher, onClose }: {
  office: OfficeConfig;
  candidates: Candidate[];
  onEscolher: (numero: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [termo, setTermo] = useState("");
  const resultado = useMemo(() => filtrarCandidatos(candidates, office.key, termo), [candidates, office.key, termo]);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="busca-titulo"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      className="m-auto flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md flex-col rounded-lg border border-slate-300 bg-white p-4 text-slate-900 shadow-lg backdrop:bg-black/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      <button type="button" onClick={onClose} aria-label="Fechar" className="absolute top-2 right-2 rounded p-1 text-2xl leading-none opacity-70 hover:opacity-100">
        ×
      </button>
      <h2 id="busca-titulo" className="pr-8 text-lg font-bold">Buscar candidato</h2>
      <p className="text-xs text-slate-600 uppercase dark:text-slate-400">{office.label}</p>
      <input
        type="search"
        autoFocus
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Nome, partido ou número"
        aria-label="Nome, partido ou número"
        className="mt-3 w-full rounded-md border border-slate-400 bg-transparent px-3 py-2 text-base dark:border-slate-500"
      />
      <ul className="mt-3 flex-1 overflow-y-auto" aria-live="polite">
        {resultado.length === 0 && (
          <li className="py-6 text-center text-sm text-slate-600 dark:text-slate-400">Nenhum candidato encontrado para {office.label.toLowerCase()}.</li>
        )}
        {resultado.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onEscolher(c.number)}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-slate-100 focus-visible:bg-slate-100 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800"
            >
              {c.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.photoUrl} alt="" loading="lazy" className="h-14 w-11 shrink-0 rounded border border-slate-300 object-cover object-top dark:border-slate-600" />
              ) : (
                <span aria-hidden="true" className="h-14 w-11 shrink-0 rounded border border-dashed border-slate-300 dark:border-slate-600" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{c.ballotName}</span>
                <span className="block text-xs text-slate-600 dark:text-slate-400">{c.party.acronym}</span>
              </span>
              <span className="text-xl font-bold tabular-nums">{c.number}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-center text-xs text-slate-600 dark:text-slate-400">
        Ao escolher, o número vai para a urna. Confira e aperte CONFIRMA.
      </p>
    </dialog>
  );
}
