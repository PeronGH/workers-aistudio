import { z } from "zod";

export const IMAGE_MODELS = ["flux2-dev", "flux2-klein-9b"] as const;
export type ImageModel = (typeof IMAGE_MODELS)[number];

export const IMAGE_MODEL_LABELS: Record<ImageModel, string> = {
  "flux2-dev": "FLUX.2 [dev]",
  "flux2-klein-9b": "FLUX.2 [klein] 9B"
};

export const WIDTH_RANGE = { min: 256, max: 2048, step: 64 } as const;
export const HEIGHT_RANGE = { min: 256, max: 2048, step: 64 } as const;
export const STEPS_RANGE = { min: 1, max: 50, step: 1 } as const;
export const MAX_REFERENCES = 4;
export const PROMPT_MAX = 2000;

export const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  model: "flux2-dev",
  width: 1024,
  height: 1024,
  steps: 25
};

export const ImageSettingsSchema = z.object({
  model: z.enum(IMAGE_MODELS),
  width: z.number().int().min(WIDTH_RANGE.min).max(WIDTH_RANGE.max),
  height: z.number().int().min(HEIGHT_RANGE.min).max(HEIGHT_RANGE.max),
  steps: z.number().int().min(STEPS_RANGE.min).max(STEPS_RANGE.max)
});

export type ImageSettings = z.infer<typeof ImageSettingsSchema>;

export const ImageRequestSchema = ImageSettingsSchema.extend({
  prompt: z.string().min(1).max(PROMPT_MAX),
  referenceKeys: z.array(z.string().min(1)).max(MAX_REFERENCES)
});

export type ImageRequest = z.infer<typeof ImageRequestSchema>;

export const ImageGenerationEntrySchema = ImageSettingsSchema.extend({
  id: z.string().min(1),
  prompt: z.string(),
  referenceKeys: z.array(z.string()),
  createdAt: z.number()
});

export type ImageGenerationEntry = z.infer<typeof ImageGenerationEntrySchema>;
