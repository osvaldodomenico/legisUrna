"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CONSENTIMENTO_TEXTO } from "@/lib/apuracao/consentimento";
import { mascaraWhatsapp } from "@/lib/apuracao/mascara";

type Etapa = "pergunta" | "form" | "enviado" | "fechado";
const CHAVE = "legisurna:contato-respondido";

/** Convite opcional depois do FIM, em modal (abre quando o som do FIM termina). Não sabe nada dos votos. */
// Quem já respondeu nesta aba não vê o convite de novo em "Votar novamente".
// Só é montado depois do FIM (nunca no SSR), então pode ler o sessionStorage direto.
function jaRespondeu(): boolean {
  try {
    return sessionStorage.getItem(CHAVE) !== null;
  } catch {
    return false;
  }
}

export function ContatoCard() {
  const [etapa, setEtapa] = useState<Etapa>(() => (jaRespondeu() ? "fechado" : "pergunta"));
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const lembrar = () => {
    try { sessionStorage.setItem(CHAVE, "1"); } catch {}
  };
  // Fechar pelo X, Esc ou "Não, obrigado" conta como recusa (não pergunta de novo nesta aba).
  const fechar = () => { lembrar(); setEtapa("fechado"); };

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch("/api/contatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: f.get("nome"), whatsapp: f.get("whatsapp"), consentimento: f.get("consentimento") === "on" }),
      });
      if (r.ok) {
        lembrar();
        setEtapa("enviado");
      } else {
        setErro((await r.json().catch(() => null))?.erro ?? "Não foi possível salvar agora. Tente de novo.");
      }
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (etapa === "fechado") return null;

  if (etapa === "enviado") {
    return (
      <Modal onClose={() => setEtapa("fechado")}>
        <p className="font-semibold" role="status">Pronto! Você vai receber informações da ShiftLegis no WhatsApp.</p>
        <button type="button" onClick={() => setEtapa("fechado")} className="mt-3 w-full rounded-md bg-slate-900 px-3 py-2 font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
          Fechar
        </button>
      </Modal>
    );
  }

  if (etapa === "pergunta") {
    return (
      <Modal onClose={fechar}>
        <p className="font-semibold">Quer receber informações da ShiftLegis pelo WhatsApp?</p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => setEtapa("form")} className="flex-1 rounded-md bg-slate-900 px-3 py-2 font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
            Sim, quero
          </button>
          <button type="button" onClick={fechar} className="flex-1 rounded-md border border-slate-400 px-3 py-2 font-semibold dark:border-slate-500">
            Não, obrigado
          </button>
        </div>
      </Modal>
    );
  }

  const campo = "mt-1 w-full rounded-md border border-slate-400 bg-transparent px-3 py-2 text-base dark:border-slate-500";
  return (
    <Modal onClose={fechar}>
      <form onSubmit={enviar} className="flex flex-col gap-3">
        <label className="font-semibold">
          Nome
          <input name="nome" required minLength={2} maxLength={80} autoComplete="name" className={campo} />
        </label>
        <label className="font-semibold">
          WhatsApp com DDD
          <input name="whatsapp" required type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(11) 91234-5678" maxLength={15} className={campo}
            onChange={(e) => { e.currentTarget.value = mascaraWhatsapp(e.currentTarget.value); }} />
        </label>
        <label className="flex items-start gap-2 text-xs leading-5 text-slate-700 dark:text-slate-300">
          <input name="consentimento" type="checkbox" required className="mt-1" />
          <span>{CONSENTIMENTO_TEXTO} <a href="/privacidade" target="_blank" className="underline">Política de privacidade</a>.</span>
        </label>
        {erro && <p className="text-xs font-semibold text-red-700 dark:text-red-400" role="alert">{erro}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={enviando} className="flex-1 rounded-md bg-slate-900 px-3 py-2 font-semibold text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900">
            {enviando ? "Enviando…" : "Enviar"}
          </button>
          <button type="button" onClick={fechar} className="rounded-md border border-slate-400 px-3 py-2 font-semibold dark:border-slate-500">
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** `<dialog>` nativo: showModal() dá foco preso, Esc e fundo escurecido sem dependência. */
function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label="Receber informações da ShiftLegis"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-slate-300 bg-white p-5 pr-10 text-left text-sm text-slate-900 shadow-lg backdrop:bg-black/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      <button type="button" onClick={onClose} aria-label="Fechar" className="absolute top-2 right-2 rounded p-1 text-lg leading-none opacity-70 hover:opacity-100">
        ×
      </button>
      {children}
    </dialog>
  );
}
