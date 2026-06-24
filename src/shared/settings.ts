import { z } from "zod";

export const TEMPERATURE_RANGE = { min: 0, max: 2, step: 0.05 } as const;
export const TOP_P_RANGE = { min: 0, max: 1, step: 0.01 } as const;
export const PRESETS = ["thinking", "instant", "manual"] as const;
export const DEFAULT_PRESET: Preset = "thinking";

export const MODELS = [
  { id: "@cf/moonshotai/kimi-k2.6", label: "Kimi K2.6" },
  { id: "@cf/moonshotai/kimi-k2.7-code", label: "Kimi K2.7 Code" },
  { id: "@cf/zai-org/glm-5.2", label: "GLM-5.2" }
] as const;

export type ModelId = (typeof MODELS)[number]["id"];
export const DEFAULT_MODEL: ModelId = "@cf/moonshotai/kimi-k2.6";

export const MAX_TOKENS_RANGE = { min: 1, max: 98304 } as const;
export const DEFAULT_MAX_TOKENS = 2048;

export const RunSettingsSchema = z
  .object({
    model: z.enum(MODELS.map((m) => m.id) as [ModelId, ...ModelId[]]),
    preset: z.enum(PRESETS),
    systemPrompt: z.string(),
    temperature: z
      .number()
      .min(TEMPERATURE_RANGE.min)
      .max(TEMPERATURE_RANGE.max),
    top_p: z.number().min(TOP_P_RANGE.min).max(TOP_P_RANGE.max),
    thinking: z.preprocess(
      (v) => (typeof v === "string" ? v !== "none" : v),
      z.boolean()
    ),
    maxTokens: z
      .number()
      .int()
      .min(MAX_TOKENS_RANGE.min)
      .max(MAX_TOKENS_RANGE.max),
    stop: z.array(z.string().min(1))
  })
  .partial();

export type RunSettings = z.infer<typeof RunSettingsSchema>;
export type Preset = (typeof PRESETS)[number];

export const TRANSCRIPTION_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" }
] as const;

export const LocalSettingsSchema = z
  .object({
    transcriptionLanguage: z.enum(
      TRANSCRIPTION_LANGUAGES.map((l) => l.code) as [string, ...string[]]
    )
  })
  .partial();

export type LocalSettings = z.infer<typeof LocalSettingsSchema>;

export const PRESET_VALUES: Record<
  Exclude<Preset, "manual">,
  { temperature: number; top_p: number; thinking?: boolean }
> = {
  thinking: { temperature: 1.0, top_p: 0.95 },
  instant: { temperature: 0.6, top_p: 0.95, thinking: false }
};
