const MAX_BYTES = 10 * 1024 * 1024;
const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif"
};

export async function handleUpload(
  request: Request,
  env: Env
): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return Response.json(
      { error: "Only image uploads are accepted" },
      { status: 415 }
    );
  }
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BYTES) {
    return Response.json(
      { error: "File too large (max 10 MB)" },
      { status: 413 }
    );
  }
  if (!request.body) {
    return Response.json({ error: "Empty body" }, { status: 400 });
  }

  const ext = EXT_BY_TYPE[contentType] ?? "bin";
  const key = `${crypto.randomUUID()}.${ext}`;

  await env.UPLOADS.put(key, request.body, {
    httpMetadata: { contentType }
  });

  return Response.json({ key, url: `/api/upload/${key}` });
}

export async function serveUpload(key: string, env: Env): Promise<Response> {
  const object = await env.UPLOADS.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("etag", object.httpEtag);
  return new Response(object.body, { headers });
}
