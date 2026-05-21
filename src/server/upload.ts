import type { Context } from "hono";

const MAX_BYTES = 10 * 1024 * 1024;
const PREFIX = "attachments/";
const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif"
};

export async function uploadHandler(
  c: Context<{ Bindings: Env }>
): Promise<Response> {
  const contentType = c.req.header("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return c.json({ error: "Only image uploads are accepted" }, 415);
  }
  const contentLength = Number(c.req.header("content-length") ?? "0");
  if (contentLength > MAX_BYTES) {
    return c.json({ error: "File too large (max 10 MB)" }, 413);
  }
  if (!c.req.raw.body) {
    return c.json({ error: "Empty body" }, 400);
  }

  const ext = EXT_BY_TYPE[contentType] ?? "bin";
  const name = `${crypto.randomUUID()}.${ext}`;
  await c.env.UPLOADS.put(PREFIX + name, c.req.raw.body, {
    httpMetadata: { contentType }
  });

  return c.json({ key: name, url: `/api/upload/${name}` });
}

export async function serveUploadHandler(
  c: Context<{ Bindings: Env }>
): Promise<Response> {
  const key = c.req.param("key");
  if (!key) return c.text("Not found", 404);
  const object = await c.env.UPLOADS.get(PREFIX + key);
  if (!object) return c.text("Not found", 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("etag", object.httpEtag);
  return new Response(object.body, { headers });
}
