import { db } from "@/lib/db";
import { parseContato } from "@/lib/apuracao/payload";
import { gravarContato } from "@/lib/apuracao/repo";
import { excedeu, ipDe } from "@/lib/apuracao/limite";

/** Cadastro opcional de quem aceitou receber informações. Não recebe nem guarda nada da simulação. */
export async function POST(req: Request) {
  if (excedeu("contato:" + ipDe(req), 5)) return Response.json({ erro: "Muitas tentativas. Tente mais tarde." }, { status: 429 });
  const body = await req.json().catch(() => null);
  const c = parseContato(body);
  if (!c) return Response.json({ erro: "Confira o nome e o WhatsApp com DDD." }, { status: 400 });
  const sql = db();
  if (!sql) return Response.json({ erro: "Cadastro indisponível no momento." }, { status: 503 });
  try {
    await gravarContato(sql, c);
  } catch (e) {
    console.error("[contatos] falha ao gravar", (e as Error).message);
    return Response.json({ erro: "Não foi possível salvar agora. Tente de novo." }, { status: 500 });
  }
  return new Response(null, { status: 204 });
}
