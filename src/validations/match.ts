import { z } from "zod";

/**
 * Schema para atualização de agendamento de partida
 */
export const updateMatchScheduleSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  round: z.number().int().positive().optional(),
});

/**
 * Schema para reporte de resultado de partida
 */
export const updateMatchResultSchema = z.object({
  teamAScore: z.number().int().min(0),
  teamBScore: z.number().int().min(0),
  extraTime: z.boolean().optional().default(false),
  penalties: z.boolean().optional().default(false),
  notes: z.string().max(1000).optional(),
});

/**
 * Schema completo para atualização de partida
 * Permite atualizar agendamento e/ou resultado
 */
export const updateMatchSchema = z
  .object({
    scheduledAt: z.string().datetime().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    round: z.number().int().positive().optional(),
    teamAScore: z.number().int().min(0).optional(),
    teamBScore: z.number().int().min(0).optional(),
    extraTime: z.boolean().optional().default(false),
    penalties: z.boolean().optional().default(false),
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      // Se houver score, ambos devem estar presentes
      const hasScoreA = data.teamAScore !== undefined;
      const hasScoreB = data.teamBScore !== undefined;
      return hasScoreA === hasScoreB;
    },
    {
      message: "teamAScore e teamBScore devem ser fornecidos juntos",
    }
  );

export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
