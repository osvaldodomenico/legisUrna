import { z } from "zod";
import { FULL_OFFICES } from "@/domain/voting/rules";
import type { Candidate, Office } from "@/domain/voting/types";

// ---------- simulação (anônima) ----------

export interface VotoGravavel {
  cargo: Office;
  tipo: "candidato" | "branco" | "nulo";
  candidatoId: string | null;
}

export interface SimulacaoGravavel {
  estado: string;
  votos: VotoGravavel[];
}

const simulacaoSchema = z.object({
  estado: z.string().regex(/^[A-Z]{2}$/),
  votos: z.array(
    z.object({
      cargo: z.enum(FULL_OFFICES.map((o) => o.key) as [Office, ...Office[]]),
      tipo: z.enum(["candidato", "branco", "nulo"]),
      candidatoId: z.string().max(80).nullable(),
    })
  ),
});

const isSenator = (o: Office) => o === "senator_1" || o === "senator_2";

/** Valida o corpo contra a lista de candidatos: 6 cargos, um voto cada, candidatura real no cargo certo
 *  e sem repetir o senador. Devolve null se qualquer coisa não bater (voto forjado não entra na apuração). */
export function parseSimulacao(body: unknown, candidates: Candidate[]): SimulacaoGravavel | null {
  const r = simulacaoSchema.safeParse(body);
  if (!r.success) return null;
  const { estado, votos } = r.data;
  const cargos = new Set(votos.map((v) => v.cargo));
  if (votos.length !== FULL_OFFICES.length || cargos.size !== FULL_OFFICES.length) return null;

  for (const v of votos) {
    if (v.tipo !== "candidato") {
      if (v.candidatoId !== null) return null;
      continue;
    }
    const c = candidates.find((x) => x.id === v.candidatoId);
    if (!c) return null;
    const cargoOk = c.office === v.cargo || (isSenator(c.office) && isSenator(v.cargo));
    if (!cargoOk) return null;
    if (v.cargo !== "president" && c.stateCode && c.stateCode !== estado) return null;
  }
  const s1 = votos.find((v) => v.cargo === "senator_1")?.candidatoId;
  const s2 = votos.find((v) => v.cargo === "senator_2")?.candidatoId;
  if (s1 && s1 === s2) return null;

  return { estado, votos: votos as VotoGravavel[] };
}

// ---------- contato (consentimento) ----------

/** Só dígitos, com DDD, no formato 55DDNNNNNNNNN. Null se não for um número brasileiro plausível. */
export function normalizaWhatsapp(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 || d.length === 13) {
    if (!d.startsWith("55")) return null;
    d = d.slice(2);
  }
  if (d.length !== 10 && d.length !== 11) return null;
  if (/^0/.test(d) || /^(\d)\1+$/.test(d)) return null;
  if (d.length === 11 && d[2] !== "9") return null;
  return "55" + d;
}

const contatoSchema = z.object({
  nome: z.string().trim().min(2).max(80),
  whatsapp: z.string().max(30),
  consentimento: z.literal(true),
});

export interface ContatoGravavel {
  nome: string;
  whatsapp: string;
}

export function parseContato(body: unknown): ContatoGravavel | null {
  const r = contatoSchema.safeParse(body);
  if (!r.success) return null;
  const whatsapp = normalizaWhatsapp(r.data.whatsapp);
  if (!whatsapp) return null;
  return { nome: r.data.nome.replace(/\s+/g, " "), whatsapp };
}
