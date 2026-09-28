import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

// /apuracao (resultados + contatos) só com senha. Resultado da simulação NUNCA é público.
const PEDIR_SENHA = new NextResponse("Acesso restrito.", {
  status: 401,
  headers: { "WWW-Authenticate": 'Basic realm="LegisUrna apuracao", charset="UTF-8"' },
});

function senhaConfere(recebida: string, esperada: string): boolean {
  const a = Buffer.from(recebida);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function proxy(req: NextRequest) {
  const esperada = process.env.APURACAO_SENHA;
  if (!esperada) return new NextResponse("Apuração desativada.", { status: 503 });
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Basic ")) return PEDIR_SENHA;
  const decod = Buffer.from(auth.slice(6), "base64").toString("utf8");
  const senha = decod.slice(decod.indexOf(":") + 1);
  if (!senhaConfere(senha, esperada)) return PEDIR_SENHA;
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = { matcher: ["/apuracao", "/apuracao/:path*"] };
