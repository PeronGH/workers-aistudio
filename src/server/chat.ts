import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { ChatMessageSchema, type ChatMessage } from "../shared/messages";
import {
  DEFAULT_MODEL,
  DEFAULT_PRESET,
  PRESET_VALUES,
  RunSettingsSchema,
  type RunSettings
} from "../shared/settings";
import { uploadIdFromUrl, uploadIdToDataUrl } from "./images";

const MAX_COMPLETION_TOKENS = 98304;

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  settings: RunSettingsSchema.optional()
});

export const chatRoutes = new Hono<{ Bindings: Env }>().post(
  "/",
  zValidator("json", ChatRequestSchema),
  async (c) => {
    const { messages, settings = {} } = c.req.valid("json");
    let resolved: ChatMessage[];
    try {
      resolved = await resolveImageContent(messages, c.env);
    } catch (err) {
      return c.json({ error: (err as Error).message }, 400);
    }
    const model = settings.model ?? DEFAULT_MODEL;
    const upstream = await c.env.AI.run(
      model as keyof AiModels,
      buildPayload(resolved, settings),
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

/**
 * Replace stored image URLs with inline base64 data URIs. Data URIs (anonymous
 * mode) pass through untouched; everything else is read from R2 by id. This
 * runs on every send — including retry/edit replays of saved conversations,
 * whose messages also carry URLs.
 */
async function resolveImageContent(
  messages: ChatMessage[],
  env: Env
): Promise<ChatMessage[]> {
  return Promise.all(
    messages.map(async (m) => {
      if (m.role !== "user" || typeof m.content === "string") return m;
      const content = await Promise.all(
        m.content.map(async (part) => {
          if (part.type !== "image_url") return part;
          const url = part.image_url.url;
          if (url.startsWith("data:")) return part;
          const id = uploadIdFromUrl(url);
          const dataUrl = id ? await uploadIdToDataUrl(env, id) : null;
          if (!dataUrl) throw new Error(`Image not found: ${url}`);
          return { ...part, image_url: { ...part.image_url, url: dataUrl } };
        })
      );
      return { ...m, content };
    })
  );
}

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

  // Different model chat templates read different thinking flags, so set every
  // knob together (see workers-ai-proxy). preserve/clear are inverse.
  const thinking = resolved.thinking !== false;
  out.chat_template_kwargs = {
    thinking,
    enable_thinking: thinking,
    preserve_thinking: true,
    clear_thinking: false
  };

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
