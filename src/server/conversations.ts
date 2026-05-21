import { z } from "zod";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  ConversationStateSchema,
  CURRENT_VERSION,
  type ConversationState
} from "../shared/conversations";

const PREFIX = "conversations/";
const UuidParamSchema = z.object({ uuid: z.uuid() });

export const uuidParamValidator = zValidator("param", UuidParamSchema);
export const conversationBodyValidator = zValidator(
  "json",
  ConversationStateSchema
);

function paramUuid(c: Context): string {
  return (
    c.req as unknown as {
      valid(target: "param"): z.infer<typeof UuidParamSchema>;
    }
  ).valid("param").uuid;
}

function bodyState(c: Context): ConversationState {
  return (
    c.req as unknown as {
      valid(target: "json"): ConversationState;
    }
  ).valid("json");
}

function keyFor(uuid: string): string {
  return `${PREFIX}${uuid}.json`;
}

export async function getConversationHandler(
  c: Context<{ Bindings: Env }>
): Promise<Response> {
  const uuid = paramUuid(c);
  const object = await c.env.UPLOADS.get(keyFor(uuid));
  if (!object) return c.text("Not found", 404);
  const raw = await object.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return c.json({ error: "Stored conversation is not valid JSON" }, 500);
  }
  const result = ConversationStateSchema.safeParse(parsed);
  if (!result.success) {
    return c.json(
      {
        error: "Stored conversation failed schema validation",
        expectedVersion: CURRENT_VERSION
      },
      409
    );
  }
  return c.json(result.data);
}

export async function putConversationHandler(
  c: Context<{ Bindings: Env }>
): Promise<Response> {
  const uuid = paramUuid(c);
  const state = bodyState(c);
  await c.env.UPLOADS.put(keyFor(uuid), JSON.stringify(state), {
    httpMetadata: { contentType: "application/json" }
  });
  return new Response(null, { status: 204 });
}

export async function deleteConversationHandler(
  c: Context<{ Bindings: Env }>
): Promise<Response> {
  const uuid = paramUuid(c);
  await c.env.UPLOADS.delete(keyFor(uuid));
  return new Response(null, { status: 204 });
}
