import { z } from "zod";

export const TEMPERATURE_RANGE = { min: 0, max: 2, step: 0.05 } as const;
export const TOP_P_RANGE = { min: 0, max: 1, step: 0.01 } as const;
export const PENALTY_RANGE = { min: -2, max: 2, step: 0.1 } as const;
export const STOP_MAX = 4;
export const PRESETS = ["thinking", "instant", "manual"] as const;
export const DEFAULT_PRESET: Preset = "thinking";

export const RunSettingsSchema = z
  .object({
    preset: z.enum(PRESETS),
    systemPrompt: z.string(),
    temperature: z
      .number()
      .min(TEMPERATURE_RANGE.min)
      .max(TEMPERATURE_RANGE.max),
    top_p: z.number().min(TOP_P_RANGE.min).max(TOP_P_RANGE.max),
    max_completion_tokens: z.number().int().positive(),
    stop: z.array(z.string().min(1)).max(STOP_MAX),
    thinking: z.preprocess(
      (v) => (typeof v === "string" ? v !== "none" : v),
      z.boolean()
    ),
    frequency_penalty: z.number().min(PENALTY_RANGE.min).max(PENALTY_RANGE.max),
    presence_penalty: z.number().min(PENALTY_RANGE.min).max(PENALTY_RANGE.max),
    seed: z.number().int()
  })
  .partial();

export type RunSettings = z.infer<typeof RunSettingsSchema>;
export type Preset = (typeof PRESETS)[number];

export const PRESET_VALUES: Record<
  Exclude<Preset, "manual">,
  { temperature: number; top_p: number; thinking?: boolean }
> = {
  thinking: { temperature: 1.0, top_p: 0.95 },
  instant: { temperature: 0.6, top_p: 0.95, thinking: false }
};
