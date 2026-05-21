import { z } from "zod";

export const TEMPERATURE_RANGE = { min: 0, max: 2, step: 0.05 } as const;
export const TOP_P_RANGE = { min: 0, max: 1, step: 0.01 } as const;
export const PENALTY_RANGE = { min: -2, max: 2, step: 0.1 } as const;
export const STOP_MAX = 4;
export const THINKING_LEVELS = ["none", "low", "medium", "high"] as const;
export const SEARCH_CONTEXT_SIZES = ["low", "medium", "high"] as const;

export const RunSettingsSchema = z
  .object({
    systemPrompt: z.string(),
    temperature: z
      .number()
      .min(TEMPERATURE_RANGE.min)
      .max(TEMPERATURE_RANGE.max),
    top_p: z.number().min(TOP_P_RANGE.min).max(TOP_P_RANGE.max),
    max_completion_tokens: z.number().int().positive(),
    stop: z.array(z.string().min(1)).max(STOP_MAX),
    thinking: z.enum(THINKING_LEVELS),
    web_search: z.object({
      search_context_size: z.enum(SEARCH_CONTEXT_SIZES)
    }),
    frequency_penalty: z.number().min(PENALTY_RANGE.min).max(PENALTY_RANGE.max),
    presence_penalty: z.number().min(PENALTY_RANGE.min).max(PENALTY_RANGE.max),
    seed: z.number().int()
  })
  .partial();

export type RunSettings = z.infer<typeof RunSettingsSchema>;
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];
export type SearchContextSize = (typeof SEARCH_CONTEXT_SIZES)[number];
