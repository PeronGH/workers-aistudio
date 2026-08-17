import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL,
  resolveSampling,
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
  const { temperature, top_p } = resolveSampling(settings);
  const out: Record<string, unknown> = {
    prompt,
    stream: true,
    max_tokens: settings.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature,
    top_p
  };
  if (settings.stop?.length) out.stop = settings.stop;
  return out;
}
