import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { ChatMessageSchema, type ChatMessage } from "../shared/messages";
import { RunSettingsSchema, type RunSettings } from "../shared/settings";

const MODEL = "@cf/moonshotai/kimi-k2.6";

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
      { returnRawResponse: true }
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
  const out: Record<string, unknown> = {
    messages: withSystemPrompt(messages, settings.systemPrompt),
    stream: true
  };

  if (settings.temperature !== undefined)
    out.temperature = settings.temperature;
  if (settings.top_p !== undefined) out.top_p = settings.top_p;
  if (settings.max_completion_tokens !== undefined) {
    out.max_completion_tokens = settings.max_completion_tokens;
  }
  if (settings.stop && settings.stop.length > 0) out.stop = settings.stop;
  if (settings.frequency_penalty !== undefined) {
    out.frequency_penalty = settings.frequency_penalty;
  }
  if (settings.presence_penalty !== undefined) {
    out.presence_penalty = settings.presence_penalty;
  }
  if (settings.seed !== undefined) out.seed = settings.seed;
  if (settings.web_search !== undefined) {
    out.web_search_options = settings.web_search;
  }

  if (settings.thinking === "none") {
    out.chat_template_kwargs = { thinking: false };
  } else if (settings.thinking) {
    out.reasoning_effort = settings.thinking;
  }

  return out;
}

function withSystemPrompt(
  messages: ChatMessage[],
  systemPrompt: string | undefined
): ChatMessage[] {
  const trimmed = systemPrompt?.trim();
  if (!trimmed) return messages;
  return [{ role: "system", content: trimmed }, ...messages];
}
