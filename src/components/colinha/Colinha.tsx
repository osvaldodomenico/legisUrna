"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { textoWhatsapp, type LinhaColinha } from "./linhas";
import { desenharColinha } from "./desenhar";

const ARQUIVO = "minha-colinha.png";
const AVISO = "Confira sempre o número do candidato na urna.";

/** Colinha do fim da votação, em `<dialog>` nativo: mostra a própria imagem 1080×1920 que será
 *  salva. Tudo acontece no aparelho — a imagem é desenhada num canvas e nada vai para o servidor. */
export function ColinhaModal({ linhas, onClose }: { linhas: LinhaColinha[]; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [png, setPng] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  // Gera a imagem uma vez ao abrir; o "Salvar" usa o mesmo arquivo da prévia.
  useEffect(() => {
    let vivo = true;
    let url: string | null = null;
    desenharColinha(linhas, location.host)
      .then((b) => {
        if (!vivo) return;
        url = URL.createObjectURL(b);
        setPng(b);
        setPreview(url);
      })
      .catch(() => vivo && setErro("Não foi possível gerar a imagem. Tente de novo."));
    return () => {
      vivo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [linhas]);

  const salvar = () => {
    if (!png) return;
    baixar(png);
    track("colinha_saved", {});
  };

  // Link wa.me abre o app no celular e o WhatsApp Web no computador, já com o texto.
  const whatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(textoWhatsapp(linhas, location.origin))}`, "_blank", "noopener");
    track("colinha_shared", {});
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="colinha-titulo"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg border border-slate-300 bg-white p-4 text-slate-900 shadow-lg backdrop:bg-black/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      <button type="button" onClick={onClose} aria-label="Fechar" className="absolute top-2 right-2 rounded p-1 text-2xl leading-none opacity-70 hover:opacity-100">
        ×
      </button>
      <h2 id="colinha-titulo" className="text-center text-lg font-bold tracking-wide uppercase">Sua colinha</h2>
      <p className="mb-3 text-center text-xs text-slate-600 dark:text-slate-400">Pronta para o status e para levar no dia da eleição.</p>

      <div className="mx-auto aspect-[9/16] w-full max-w-[18rem] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">{erro ? "" : "Montando sua colinha…"}</div>
        )}
      </div>

      {/* A imagem é só visual: a lista abaixo é o que o leitor de tela lê. */}
      <ol className="sr-only">
        {linhas.map((l) => (
          <li key={l.cargo}>
            {l.cargo}: {l.tipo === "blank" ? "voto em branco" : l.tipo === "null" ? `número ${l.numero}, voto nulo` : `número ${l.numero}, ${l.nome} ${l.partido ?? ""}`}
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-col gap-2">
        <button type="button" onClick={salvar} disabled={!png} className="rounded-md bg-slate-900 px-3 py-2 font-semibold text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900">
          Salvar imagem
        </button>
        <button type="button" onClick={whatsapp} className="rounded-md border border-slate-400 px-3 py-2 font-semibold dark:border-slate-500">
          Compartilhar com amigos no WhatsApp
        </button>
        <a href="https://ondevotar.shiftlegis.com.br" target="_blank" rel="noopener noreferrer" className="rounded-md border border-slate-400 px-3 py-2 text-center font-semibold dark:border-slate-500">
          Onde votar? Encontre seu local
        </a>
      </div>
      {erro && <p className="mt-2 text-xs font-semibold text-red-700 dark:text-red-400" role="alert">{erro}</p>}
      <p className="mt-3 text-center text-xs text-slate-600 dark:text-slate-400">{AVISO} Simulação não oficial.</p>
    </dialog>
  );
}

function baixar(png: Blob) {
  const url = URL.createObjectURL(png);
  const a = document.createElement("a");
  a.href = url;
  a.download = ARQUIVO;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
