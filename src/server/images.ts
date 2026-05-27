import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { ImageRequestSchema, type ImageModel } from "../shared/images";

const ATTACHMENT_PREFIX = "attachments/";
const IMAGE_PREFIX = "images/";
const KEY_RE = /^[A-Za-z0-9._-]+$/;

const MODEL_ID: Record<ImageModel, keyof AiModels> = {
  "flux2-dev": "@cf/black-forest-labs/flux-2-dev",
  "flux2-klein-9b": "@cf/black-forest-labs/flux-2-klein-9b"
};

const IdParamSchema = z.object({
  id: z.string().regex(KEY_RE)
});

const DeleteQuerySchema = z.object({
  references: z.string().optional()
});

export const imageRoutes = new Hono<{ Bindings: Env }>()
  .post("/", zValidator("json", ImageRequestSchema), async (c) => {
    const { prompt, model, width, height, steps, referenceKeys } =
      c.req.valid("json");

    const form = new FormData();
    form.append("prompt", prompt);
    form.append("width", String(width));
    form.append("height", String(height));
    form.append("steps", String(steps));

    for (const [i, key] of referenceKeys.entries()) {
      if (!KEY_RE.test(key)) {
        return c.json({ error: `Invalid reference key: ${key}` }, 400);
      }
      const object = await c.env.UPLOADS.get(ATTACHMENT_PREFIX + key);
      if (!object) {
        return c.json({ error: `Reference not found: ${key}` }, 400);
      }
      const blob = await object.blob();
      form.append(`input_image_${i}`, blob, key);
    }

    const formResponse = new Response(form);
    const body = formResponse.body;
    const contentType = formResponse.headers.get("content-type");
    if (!body || !contentType) {
      return c.json({ error: "Failed to build multipart body" }, 500);
    }

    let resp: { image?: string };
    try {
      resp = (await c.env.AI.run(MODEL_ID[model], {
        multipart: { body, contentType }
      })) as { image?: string };
    } catch (err) {
      return c.json({ error: `Model failed: ${(err as Error).message}` }, 502);
    }
    if (!resp.image) {
      return c.json({ error: "Model returned no image" }, 502);
    }

    const bytes = base64ToBytes(resp.image);
    const id = `${crypto.randomUUID()}.png`;
    await c.env.UPLOADS.put(IMAGE_PREFIX + id, bytes, {
      httpMetadata: { contentType: "image/png" }
    });

    return c.json({ id, url: `/api/images/${id}` });
  })
  .get("/:id", zValidator("param", IdParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const object = await c.env.UPLOADS.get(IMAGE_PREFIX + id);
    if (!object) return c.text("Not found", 404);
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    headers.set("etag", object.httpEtag);
    return new Response(object.body, { headers });
  })
  .delete(
    "/:id",
    zValidator("param", IdParamSchema),
    zValidator("query", DeleteQuerySchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const { references } = c.req.valid("query");
      await c.env.UPLOADS.delete(IMAGE_PREFIX + id);
      if (references) {
        const keys = references.split(",").filter((k) => KEY_RE.test(k));
        await Promise.all(
          keys.map((k) => c.env.UPLOADS.delete(ATTACHMENT_PREFIX + k))
        );
      }
      return c.body(null, 204);
    }
  );

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
