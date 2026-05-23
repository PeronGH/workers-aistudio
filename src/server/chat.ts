import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { ChatMessageSchema, type ChatMessage } from "../shared/messages";
import {
  DEFAULT_PRESET,
  PRESET_VALUES,
  RunSettingsSchema,
  type RunSettings
} from "../shared/settings";

const MODEL = "@cf/moonshotai/kimi-k2.6";
const MAX_COMPLETION_TOKENS = 65536;

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  settings: RunSettingsSchema.optional()
});

export const chatRoutes = new Hono<{ Bindings: Env }>().post(
  "/",
  zValidator("json", ChatRequestSchema),
  async (c) => {
    const { messages, settings = {} } = c.req.valid("json");
    const upstream = await c.env.AI.run(
      MODEL,
      buildPayload(messages, settings),
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

function buildPayload(messages: ChatMessage[], settings: RunSettings) {
  const resolved = resolveSampling(settings);
  const out: Record<string, unknown> = {
    messages: withSystemPrompt(messages, settings.systemPrompt),
    stream: true,
    max_completion_tokens: MAX_COMPLETION_TOKENS
  };

  if (resolved.temperature !== undefined)
    out.temperature = resolved.temperature;
  if (resolved.top_p !== undefined) out.top_p = resolved.top_p;
  if (resolved.thinking === false) {
    out.chat_template_kwargs = { thinking: false };
  }

  return out;
}

function resolveSampling(settings: RunSettings) {
  const preset = settings.preset ?? DEFAULT_PRESET;
  if (preset === "manual") {
    return {
      temperature: settings.temperature,
      top_p: settings.top_p,
      thinking: settings.thinking
    };
  }
  const p = PRESET_VALUES[preset];
  return { temperature: p.temperature, top_p: p.top_p, thinking: p.thinking };
}

function withSystemPrompt(
  messages: ChatMessage[],
  systemPrompt: string | undefined
): ChatMessage[] {
  const trimmed = systemPrompt?.trim();
  if (!trimmed) return messages;
  return [{ role: "system", content: trimmed }, ...messages];
}
