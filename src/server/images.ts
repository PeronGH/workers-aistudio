import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { ImageRequestSchema, type ImageModel } from "../shared/images";

const PREFIX = "images/";
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const MODEL_ID: Record<ImageModel, keyof AiModels> = {
  "flux2-dev": "@cf/black-forest-labs/flux-2-dev",
  "flux2-klein-9b": "@cf/black-forest-labs/flux-2-klein-9b"
};

const IdParamSchema = z.object({ id: z.uuid() });

export const imageRoutes = new Hono<{ Bindings: Env }>()
  .post("/", async (c) => {
    const contentType = c.req.header("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return c.json({ error: "Only image uploads are accepted" }, 415);
    }
    const contentLength = Number(c.req.header("content-length") ?? "0");
    if (contentLength > MAX_UPLOAD_BYTES) {
      return c.json({ error: "File too large (max 10 MB)" }, 413);
    }
    if (!c.req.raw.body) {
      return c.json({ error: "Empty body" }, 400);
    }

    const id = crypto.randomUUID();
    await c.env.UPLOADS.put(PREFIX + id, c.req.raw.body, {
      httpMetadata: { contentType }
    });

    return c.json({ id, url: `/api/images/${id}` });
  })
  .post("/generate", zValidator("json", ImageRequestSchema), async (c) => {
    const { prompt, model, width, height, steps, referenceIds } =
      c.req.valid("json");

    const blobs = await Promise.all(
      referenceIds.map(async (refId) => {
        const object = await c.env.UPLOADS.get(PREFIX + refId);
        return object ? await object.blob() : null;
      })
    );
    const missing = referenceIds.find((_, i) => blobs[i] === null);
    if (missing) {
      return c.json({ error: `Reference not found: ${missing}` }, 400);
    }

    const form = new FormData();
    form.append("prompt", prompt);
    form.append("width", String(width));
    form.append("height", String(height));
    form.append("steps", String(steps));
    for (const [i, blob] of blobs.entries()) {
      form.append(`input_image_${i}`, blob!, referenceIds[i]);
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
    const id = crypto.randomUUID();
    await c.env.UPLOADS.put(PREFIX + id, bytes, {
      httpMetadata: { contentType: "image/png" }
    });

    return c.json({ id, url: `/api/images/${id}` });
  })
  .get("/:id", zValidator("param", IdParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const object = await c.env.UPLOADS.get(PREFIX + id);
    if (!object) return c.text("Not found", 404);
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    headers.set("etag", object.httpEtag);
    return new Response(object.body, { headers });
  })
  .delete("/:id", zValidator("param", IdParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    await c.env.UPLOADS.delete(PREFIX + id);
    return c.body(null, 204);
  });

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Extract the upload id from a stored image URL (`/api/images/{id}`). */
export function uploadIdFromUrl(url: string): string | null {
  try {
    const { pathname } = new URL(url, "http://local");
    const match = pathname.match(/\/api\/images\/([^/]+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Read an upload from R2 and inline it as a base64 data URI. The Workers AI
 * backend cannot fetch our image URLs (the Worker sits behind Cloudflare
 * Access), so vision models must receive the bytes inline.
 */
export async function uploadIdToDataUrl(
  env: Env,
  id: string
): Promise<string | null> {
  const object = await env.UPLOADS.get(PREFIX + id);
  if (!object) return null;
  const contentType = object.httpMetadata?.contentType ?? "image/png";
  const bytes = new Uint8Array(await object.arrayBuffer());
  return `data:${contentType};base64,${bytesToBase64(bytes)}`;
}
