import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL,
  DEFAULT_PRESET,
  PRESET_VALUES,
  RunSettingsSchema,
  type RunSettings
} from "../shared/settings";

const CompletionRequestSchema = z.object({
  prompt: z.string().min(1),
  settings: RunSettingsSchema.optional()
});

export const completionRoutes = new Hono<{ Bindings: Env }>().post(
  "/",
  zValidator("json", CompletionRequestSchema),
  async (c) => {
    const { prompt, settings = {} } = c.req.valid("json");
    const model = settings.model ?? DEFAULT_MODEL;
    const upstream = await c.env.AI.run(
      model as keyof AiModels,
      buildPayload(prompt, settings),
      {
        returnRawResponse: true,
        extraHeaders: { "x-session-affinity": "wai-studio" }
      }
    );
    return new Response(upstream.body as ReadableStream, {
      status: upstream.status as number,
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache"
      }
    });
  }
);

function buildPayload(prompt: string, settings: RunSettings) {
  const resolved = resolveSampling(settings);
  const out: Record<string, unknown> = {
    prompt,
    stream: true,
    max_tokens: settings.maxTokens ?? DEFAULT_MAX_TOKENS
  };
  if (resolved.temperature !== undefined)
    out.temperature = resolved.temperature;
  if (resolved.top_p !== undefined) out.top_p = resolved.top_p;
  if (settings.stop?.length) out.stop = settings.stop;
  return out;
}

function resolveSampling(settings: RunSettings) {
  const preset = settings.preset ?? DEFAULT_PRESET;
  if (preset === "manual") {
    return { temperature: settings.temperature, top_p: settings.top_p };
  }
  const p = PRESET_VALUES[preset];
  return { temperature: p.temperature, top_p: p.top_p };
}
