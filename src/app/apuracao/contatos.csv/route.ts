import { db } from "@/lib/db";
import { listarContatos } from "@/lib/apuracao/repo";
import { toCsv } from "@/lib/apuracao/apurar";

export const dynamic = "force-dynamic";

/** Protegido pela senha do proxy (matcher /apuracao/:path*). */
export async function GET() {
  const sql = db();
  if (!sql) return new Response("Banco não configurado.", { status: 503 });
  const contatos = await listarContatos(sql);
  const csv = toCsv(
    ["nome", "whatsapp", "cadastrado_em", "consentimento"],
    contatos.map((c) => [c.nome, c.whatsapp, c.criado_em.toISOString(), c.consentimento_versao])
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="legisurna-contatos.csv"',
      "Cache-Control": "no-store",
    },
  });
}
