import { z } from "zod";

/**
 * Schema para criação de evento
 */
export const createEventSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(120, "Nome deve ter no máximo 120 caracteres"),
  description: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .nullable()
    .optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  location: z
    .string()
    .max(200, "Localização deve ter no máximo 200 caracteres")
    .optional()
    .nullable(),
  isPublic: z.boolean().default(false),
  status: z.enum(["DRAFT", "ACTIVE", "FINISHED", "CANCELED"]).default("DRAFT"),
  bannerUrl: z
    .string()
    .url("Banner URL deve ser uma URL válida")
    .nullable()
    .optional(),
});

/**
 * Schema para atualização de evento
 */
export const updateEventSchema = createEventSchema.partial().extend({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(120, "Nome deve ter no máximo 120 caracteres")
    .optional(),
  status: z.enum(["DRAFT", "ACTIVE", "FINISHED", "CANCELED"]).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
