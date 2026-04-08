import { z } from "zod";

export const skillSchema = z.enum(["reading", "listening", "usee", "writing"]);
export const cefrSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

export const itemPayloadSchema = z.object({
  id: z.string().optional(),
  skill: skillSchema,
  subskill: z.string().min(2),
  level: cefrSchema,
  difficulty: z.number().min(-3).max(3),
  type: z.string().min(2),
  question: z.string().min(5),
  options: z.array(z.string()).optional(),
  answer: z.string().min(1),
  explanation: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export const itemImportSchema = z.object({
  items: z.array(itemPayloadSchema).min(1),
});

export const itemUpdateSchema = itemPayloadSchema.partial().extend({
  id: z.string().min(1),
});

export type ItemPayload = z.infer<typeof itemPayloadSchema>;
export type ItemImportPayload = z.infer<typeof itemImportSchema>;
export type ItemUpdatePayload = z.infer<typeof itemUpdateSchema>;
