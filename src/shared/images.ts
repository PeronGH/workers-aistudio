import { z } from "zod";

export const IMAGE_MODELS = ["flux2-dev", "flux2-klein-9b"] as const;
export type ImageModel = (typeof IMAGE_MODELS)[number];

export const IMAGE_MODEL_LABELS: Record<ImageModel, string> = {
  "flux2-dev": "FLUX.2 [dev]",
  "flux2-klein-9b": "FLUX.2 [klein] 9B"
};

export const WIDTH_RANGE = { min: 256, max: 2048, step: 64 } as const;
export const HEIGHT_RANGE = { min: 256, max: 2048, step: 64 } as const;
export const MAX_REFERENCES = 4;
export const PROMPT_MAX = 2000;

// Per-model step ranges. Sourced from each model card on Hugging Face:
//   FLUX.2 [dev] — guidance-distilled, BFL example uses 50 steps with 28 as
//   a quality/speed trade-off.
//   FLUX.2 [klein] 9B — step-distilled, BFL example uses 4 steps; a small
//   amount of headroom is allowed for experimentation.
export const STEPS_RANGES: Record<
  ImageModel,
  { min: number; max: number; step: number; default: number }
> = {
  "flux2-dev": { min: 28, max: 50, step: 1, default: 28 },
  "flux2-klein-9b": { min: 4, max: 8, step: 1, default: 4 }
};

export const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  model: "flux2-dev",
  width: 1024,
  height: 1024,
  steps: STEPS_RANGES["flux2-dev"].default
};

const STEPS_OUTER_MIN = Math.min(
  ...Object.values(STEPS_RANGES).map((r) => r.min)
);
const STEPS_OUTER_MAX = Math.max(
  ...Object.values(STEPS_RANGES).map((r) => r.max)
);

export const ImageSettingsSchema = z.object({
  model: z.enum(IMAGE_MODELS),
  width: z.number().int().min(WIDTH_RANGE.min).max(WIDTH_RANGE.max),
  height: z.number().int().min(HEIGHT_RANGE.min).max(HEIGHT_RANGE.max),
  steps: z.number().int().min(STEPS_OUTER_MIN).max(STEPS_OUTER_MAX)
});

export type ImageSettings = z.infer<typeof ImageSettingsSchema>;

export const ImageRequestSchema = ImageSettingsSchema.extend({
  prompt: z.string().min(1).max(PROMPT_MAX),
  referenceIds: z.array(z.uuid()).max(MAX_REFERENCES)
});

export type ImageRequest = z.infer<typeof ImageRequestSchema>;

export const ImageGenerationEntrySchema = ImageSettingsSchema.extend({
  id: z.string().min(1),
  prompt: z.string(),
  referenceIds: z.array(z.string()),
  createdAt: z.number()
});

export type ImageGenerationEntry = z.infer<typeof ImageGenerationEntrySchema>;
