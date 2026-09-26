import { z } from "zod";

export const officeSchema = z.enum([
  "senator_1",
  "senator_2",
  "governor",
  "president",
  "federal_deputy",
  "state_deputy",
]);

export const officeConfigSchema = z.object({
  key: officeSchema,
  label: z.string().min(1),
  digits: z.number().int().min(1).max(6),
  order: z.number().int().min(1),
  enabled: z.boolean(),
});

export const candidateNumberSchema = z.string().regex(/^\d+$/, "Número deve conter apenas dígitos");

export const voteTypeSchema = z.enum(["candidate", "blank", "null"]);
