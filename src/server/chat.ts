import { z } from "zod";
import { ChatMessageSchema, type ChatMessage } from "../shared/messages";
import { RunSettingsSchema, type RunSettings } from "../shared/settings";

const RequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  settings: RunSettingsSchema.optional()
});

export async function handleChat(
  request: Request,
  env: Env,
  model: string
): Promise<Response> {
  let parsed;
  try {
    parsed = RequestSchema.parse(await request.json());
  } catch (err) {
    return Response.json(
      { error: "Invalid request body", details: String(err) },
      { status: 400 }
    );
  }

  const { messages, settings = {} } = parsed;
  const payload = buildPayload(messages, settings);

  const stream = (await env.AI.run(
    model as Parameters<Ai["run"]>[0],
    payload as never,
    { returnRawResponse: true }
  )) as unknown;

  if (stream instanceof Response) {
    return new Response(stream.body, {
      status: stream.status,
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache"
      }
    });
  }

  if (stream instanceof ReadableStream) {
    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache"
      }
    });
  }

  return Response.json(
    { error: "Unexpected upstream response" },
    { status: 502 }
  );
}

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
