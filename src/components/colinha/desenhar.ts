import type { LinhaColinha } from "./linhas";

// Imagem 1080×1920 (story/status). Azul-marinho com detalhe âmbar: cívico, sem cor de partido.
export const W = 1080, H = 1920;
const MARINHO = "#0b2545", MARINHO_2 = "#13447a", AMBAR = "#f5b82e", FUNDO = "#e8f0fa";
const TINTA = "#0b2545", APAGADO = "#3b4a5e", ARO = "#c9dcf3", BRANCO = "#ffffff";
const TOPO = 330, Y0 = 380, LINHA = 218, FOTO_R = 86, FOTO_X = 168, TX = 300;
const CAIXA_W = 86, CAIXA_H = 100, CAIXA_GAP = 12;

/** "Senador — 1ª vaga" → "1º SENADOR"; "Deputado Estadual ou Distrital" → "DEPUTADO ESTADUAL". */
export function rotuloCurto(cargo: string): string {
  const vaga = cargo.match(/Senador — (\d)ª vaga/);
  if (vaga) return `${vaga[1]}º SENADOR`;
  return cargo.replace(" ou Distrital", "").toUpperCase();
}

function carregar(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });
}

export async function desenharColinha(linhas: LinhaColinha[], site: string): Promise<Blob> {
  const fotos = await Promise.all(linhas.map((l) => (l.foto ? carregar(l.foto) : Promise.resolve(null))));
  // A fonte da página (Geist, já carregada) também no canvas.
  const fonte = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  const f = (peso: number, px: number, italico = false) => `${italico ? "italic " : ""}${peso} ${px}px ${fonte}`;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponível");

  // -- fundo com faixa diagonal --
  ctx.fillStyle = FUNDO;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = BRANCO;
  ctx.beginPath();
  ctx.moveTo(620, TOPO); ctx.lineTo(W, TOPO); ctx.lineTo(W, 1500); ctx.lineTo(300, H - 130); ctx.lineTo(120, H - 130);
  ctx.closePath();
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.globalAlpha = 1;

  // -- topo: faixa marinho, bloco âmbar com arcos, título --
  const g = ctx.createLinearGradient(0, 0, W, TOPO);
  g.addColorStop(0, MARINHO);
  g.addColorStop(1, MARINHO_2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, TOPO);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 270, TOPO);
  ctx.clip();
  ctx.fillStyle = AMBAR;
  ctx.beginPath();
  ctx.arc(0, TOPO, 190, -Math.PI / 2, 0);
  ctx.lineTo(0, TOPO);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 6;
  for (let r = 60; r <= 300; r += 34) {
    ctx.beginPath();
    ctx.arc(270, 0, r, Math.PI / 2, Math.PI);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = BRANCO;
  ctx.textBaseline = "alphabetic";
  ctx.font = f(900, 84);
  ctx.fillText("MINHA COLINHA", TX, 160, W - TX - 50);
  ctx.fillStyle = AMBAR;
  ctx.font = f(800, 52);
  ctx.fillText("ELEIÇÕES 2026", TX, 236, W - TX - 50);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = f(500, 32);
  ctx.fillText("Domingo, 4 de outubro · 8h às 17h", TX, 290, W - TX - 50);

  // -- uma linha por cargo --
  linhas.forEach((l, i) => {
    const y = Y0 + i * LINHA;
    const cy = y + LINHA / 2 - 8;
    // foto redonda com aro
    ctx.fillStyle = ARO;
    ctx.beginPath(); ctx.arc(FOTO_X, cy, FOTO_R + 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = BRANCO;
    ctx.beginPath(); ctx.arc(FOTO_X, cy, FOTO_R, 0, Math.PI * 2); ctx.fill();
    const foto = fotos[i];
    if (foto) {
      ctx.save();
      ctx.beginPath(); ctx.arc(FOTO_X, cy, FOTO_R - 3, 0, Math.PI * 2); ctx.clip();
      const d = (FOTO_R - 3) * 2;
      const esc = Math.max(d / foto.width, d / foto.height);
      // recorte pelo topo: o rosto fica no círculo
      ctx.drawImage(foto, FOTO_X - (foto.width * esc) / 2, cy - (FOTO_R - 3), foto.width * esc, foto.height * esc);
      ctx.restore();
    } else {
      ctx.fillStyle = ARO;
      ctx.font = f(800, 64);
      ctx.textAlign = "center";
      ctx.fillText(l.tipo === "blank" ? "B" : "—", FOTO_X, cy + 22);
      ctx.textAlign = "left";
    }

    ctx.fillStyle = TINTA;
    ctx.font = f(800, 42);
    ctx.fillText(rotuloCurto(l.cargo), TX, y + 46, W - TX - 50);
    ctx.fillStyle = APAGADO;
    ctx.font = f(500, 34, true);
    const nome = l.tipo === "candidate" ? `${l.nome ?? ""}${l.partido ? `  ·  ${l.partido}` : ""}` : l.tipo === "blank" ? "Voto em branco" : "Voto nulo";
    ctx.fillText(nome, TX, y + 88, W - TX - 50);

    const by = y + 104;
    if (l.tipo === "blank") {
      caixa(ctx, TX, by, 330, CAIXA_H, 14);
      ctx.fillStyle = BRANCO; ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = TINTA; ctx.stroke();
      ctx.fillStyle = TINTA;
      ctx.font = f(900, 64);
      ctx.textAlign = "center";
      ctx.fillText("BRANCO", TX + 165, by + 74);
      ctx.textAlign = "left";
      return;
    }
    ctx.textAlign = "center";
    l.numero.split("").forEach((d, k) => {
      const bx = TX + k * (CAIXA_W + CAIXA_GAP);
      caixa(ctx, bx, by, CAIXA_W, CAIXA_H, 12);
      ctx.fillStyle = BRANCO; ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = TINTA; ctx.stroke();
      ctx.fillStyle = TINTA;
      ctx.font = f(900, 80);
      ctx.fillText(d, bx + CAIXA_W / 2, by + 80);
    });
    ctx.textAlign = "left";
    if (l.tipo === "null") {
      const nx = TX + l.numero.length * (CAIXA_W + CAIXA_GAP) + 10;
      caixa(ctx, nx, by + 22, 150, 56, 28);
      ctx.fillStyle = AMBAR; ctx.fill();
      ctx.fillStyle = TINTA;
      ctx.font = f(900, 34);
      ctx.textAlign = "center";
      ctx.fillText("NULO", nx + 75, by + 63);
      ctx.textAlign = "left";
    }
  });

  // -- rodapé --
  ctx.textAlign = "center";
  ctx.fillStyle = TINTA;
  ctx.font = f(700, 34);
  ctx.fillText("Confira sempre o número do candidato na urna.", W / 2, H - 175, W - 100);
  ctx.fillStyle = MARINHO;
  ctx.fillRect(0, H - 130, W, 130);
  ctx.fillStyle = AMBAR;
  ctx.fillRect(0, H - 130, W, 8);
  ctx.fillStyle = BRANCO;
  ctx.font = f(900, 34);
  ctx.fillText("SIMULAÇÃO NÃO OFICIAL", W / 2, H - 70);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = f(500, 30);
  ctx.fillText(`Faça a sua: ${site}`, W / 2, H - 28);
  ctx.textAlign = "left";

  return new Promise((ok, falha) => canvas.toBlob((b) => (b ? ok(b) : falha(new Error("toBlob"))), "image/png"));
}

function caixa(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
