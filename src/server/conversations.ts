import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { ConversationStateSchema } from "../shared/conversations";

const PREFIX = "conversations/";
const UuidParamSchema = z.object({ uuid: z.uuid() });

const keyFor = (uuid: string) => `${PREFIX}${uuid}.json`;

export const conversationRoutes = new Hono<{ Bindings: Env }>()
  .get("/:uuid", zValidator("param", UuidParamSchema), async (c) => {
    const { uuid } = c.req.valid("param");
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
        { error: "Stored conversation failed schema validation" },
        409
      );
    }
    return c.json(result.data);
  })
  .put(
    "/:uuid",
    zValidator("param", UuidParamSchema),
    zValidator("json", ConversationStateSchema),
    async (c) => {
      const { uuid } = c.req.valid("param");
      const state = c.req.valid("json");
      await c.env.UPLOADS.put(keyFor(uuid), JSON.stringify(state), {
        httpMetadata: { contentType: "application/json" }
      });
      return c.body(null, 204);
    }
  )
  .delete("/:uuid", zValidator("param", UuidParamSchema), async (c) => {
    const { uuid } = c.req.valid("param");
    await c.env.UPLOADS.delete(keyFor(uuid));
    return c.body(null, 204);
  });
