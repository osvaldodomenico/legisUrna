"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import type { LinhaColinha } from "./linhas";

const ARQUIVO = "minha-colinha.png";
const AVISO = "Confira sempre o número do candidato na urna.";

/** Colinha do fim da votação: os números confirmados, para levar no dia da eleição.
 *  Tudo acontece no aparelho — a imagem é desenhada num canvas e nada vai para o servidor. */
export function Colinha({ linhas }: { linhas: LinhaColinha[] }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function comImagem(acao: (png: Blob) => Promise<void>) {
    setOcupado(true);
    setErro(null);
    try {
      await acao(await desenharColinha(linhas));
    } catch (e) {
      // Fechar a folha de compartilhar do celular dispara AbortError: não é falha.
      if (!(e instanceof DOMException && e.name === "AbortError")) setErro("Não foi possível gerar a imagem. Tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  const salvar = () => comImagem(async (png) => {
    baixar(png);
    track("colinha_saved", {});
  });

  const compartilhar = () => comImagem(async (png) => {
    const arquivo = new File([png], ARQUIVO, { type: "image/png" });
    if (navigator.canShare?.({ files: [arquivo] })) {
      await navigator.share({ files: [arquivo], title: "Minha colinha", text: `Minha colinha para 2026. Faça a sua: ${location.origin}` });
    } else if (navigator.share) {
      await navigator.share({ title: "Simulador de votação 2026", url: location.origin });
    } else {
      baixar(png);
    }
    track("colinha_shared", {});
  });

  return (
    <section aria-labelledby="colinha-titulo" className="w-full max-w-md rounded-lg border border-slate-300 bg-white p-4 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <h2 id="colinha-titulo" className="text-center text-lg font-bold tracking-wide uppercase">Sua colinha</h2>
      <p className="mb-3 text-center text-xs text-slate-600 dark:text-slate-400">Os números que você confirmou, para levar no dia da eleição.</p>

      <ol className="flex flex-col gap-3">
        {linhas.map((l) => (
          <li key={l.cargo} className="flex items-center gap-3">
            {l.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.foto} alt="" className="h-16 w-14 shrink-0 rounded-md border border-slate-300 object-cover object-top dark:border-slate-600" />
            ) : (
              <div aria-hidden="true" className="h-16 w-14 shrink-0 rounded-md border border-dashed border-slate-300 dark:border-slate-600" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-600 uppercase dark:text-slate-400">{l.cargo}</div>
              {l.nome && <div className="text-sm font-bold">{l.nome} <span className="font-normal">{l.partido}</span></div>}
              {l.tipo === "blank" ? (
                <div className="mt-1 text-xl font-bold">BRANCO</div>
              ) : (
                <div className="mt-1 flex items-center gap-1" aria-label={`Número ${l.numero}${l.tipo === "null" ? ", voto nulo" : ""}`}>
                  {l.numero.split("").map((d, i) => (
                    <span key={i} aria-hidden="true" className="flex h-10 w-8 items-center justify-center rounded-md bg-slate-900 text-2xl font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                      {d}
                    </span>
                  ))}
                  {l.tipo === "null" && <span className="ml-2 text-sm font-bold">NULO</span>}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-col gap-2">
        <button type="button" onClick={salvar} disabled={ocupado} className="rounded-md bg-slate-900 px-3 py-2 font-semibold text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900">
          Salvar imagem
        </button>
        <button type="button" onClick={compartilhar} disabled={ocupado} className="rounded-md border border-slate-400 px-3 py-2 font-semibold disabled:opacity-60 dark:border-slate-500">
          Compartilhar com amigos
        </button>
      </div>
      {erro && <p className="mt-2 text-xs font-semibold text-red-700 dark:text-red-400" role="alert">{erro}</p>}
      <p className="mt-3 text-center text-xs text-slate-600 dark:text-slate-400">{AVISO} Simulação não oficial.</p>
    </section>
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

function carregar(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });
}

// Imagem 1080 de largura (formato de story), fundo claro e tinta escura: neutra e legível impressa.
const W = 1080, PAD = 64, LINHA = 200, TOPO = 220, RODAPE = 170;
const TINTA = "#0f172a", APAGADO = "#475569", FUNDO = "#ffffff", BORDA = "#cbd5e1";
const FONTE = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

async function desenharColinha(linhas: LinhaColinha[]): Promise<Blob> {
  const fotos = await Promise.all(linhas.map((l) => (l.foto ? carregar(l.foto) : Promise.resolve(null))));
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = TOPO + linhas.length * LINHA + RODAPE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponível");

  ctx.fillStyle = FUNDO;
  ctx.fillRect(0, 0, W, canvas.height);
  ctx.fillStyle = TINTA;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 64px ${FONTE}`;
  ctx.fillText("MINHA COLINHA", W / 2, 120);
  ctx.fillStyle = APAGADO;
  ctx.font = `500 32px ${FONTE}`;
  ctx.fillText("Eleições 2026", W / 2, 170);

  ctx.textAlign = "left";
  linhas.forEach((l, i) => {
    const y = TOPO + i * LINHA;
    const FX = PAD, FW = 132, FH = 168;
    const foto = fotos[i];
    caixa(ctx, FX, y, FW, FH, 14);
    if (foto) {
      ctx.save();
      ctx.clip();
      // cobre a caixa recortando pelo topo (rosto fica visível)
      const esc = Math.max(FW / foto.width, FH / foto.height);
      ctx.drawImage(foto, FX + (FW - foto.width * esc) / 2, y, foto.width * esc, foto.height * esc);
      ctx.restore();
      caixa(ctx, FX, y, FW, FH, 14);
    }
    ctx.strokeStyle = BORDA;
    ctx.lineWidth = 3;
    ctx.stroke();

    const TX = FX + FW + 32;
    ctx.fillStyle = APAGADO;
    ctx.font = `600 28px ${FONTE}`;
    ctx.fillText(l.cargo.toUpperCase(), TX, y + 30, W - TX - PAD);
    if (l.nome) {
      ctx.fillStyle = TINTA;
      ctx.font = `700 30px ${FONTE}`;
      ctx.fillText(`${l.nome}  ${l.partido ?? ""}`.trim(), TX, y + 68, W - TX - PAD);
    }

    const BY = y + 84, BH = 84;
    if (l.tipo === "blank") {
      ctx.fillStyle = TINTA;
      ctx.font = `800 60px ${FONTE}`;
      ctx.fillText("BRANCO", TX, BY + 64);
      return;
    }
    const BW = 72, GAP = 12;
    ctx.textAlign = "center";
    l.numero.split("").forEach((d, k) => {
      const bx = TX + k * (BW + GAP);
      caixa(ctx, bx, BY, BW, BH, 12);
      ctx.fillStyle = TINTA;
      ctx.fill();
      ctx.fillStyle = FUNDO;
      ctx.font = `800 60px ${FONTE}`;
      ctx.fillText(d, bx + BW / 2, BY + 63);
    });
    ctx.textAlign = "left";
    if (l.tipo === "null") {
      ctx.fillStyle = TINTA;
      ctx.font = `800 36px ${FONTE}`;
      ctx.fillText("NULO", TX + l.numero.length * (BW + GAP) + 16, BY + 56);
    }
  });

  const ry = TOPO + linhas.length * LINHA + 20;
  ctx.textAlign = "center";
  ctx.fillStyle = APAGADO;
  ctx.font = `500 28px ${FONTE}`;
  ctx.fillText(AVISO, W / 2, ry + 30);
  ctx.fillStyle = TINTA;
  ctx.font = `800 28px ${FONTE}`;
  ctx.fillText("SIMULAÇÃO NÃO OFICIAL", W / 2, ry + 76);
  ctx.fillStyle = APAGADO;
  ctx.font = `500 26px ${FONTE}`;
  ctx.fillText(location.host, W / 2, ry + 118);

  return new Promise((ok, falha) => canvas.toBlob((b) => (b ? ok(b) : falha(new Error("toBlob"))), "image/png"));
}

function caixa(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
