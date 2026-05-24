import { Hono } from "hono";

export const transcribeRoutes = new Hono<{ Bindings: Env }>().post(
  "/",
  async (c) => {
    const contentType = c.req.header("content-type") ?? "";
    if (!contentType.startsWith("audio/")) {
      return c.json({ error: "Only audio uploads are accepted" }, 415);
    }
    if (!c.req.raw.body) {
      return c.json({ error: "Empty body" }, 400);
    }

    const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i++)
      binary += String.fromCharCode(bytes[i]);
    const audio = btoa(binary);

    const language = c.req.query("language");
    const result = await c.env.AI.run("@cf/openai/whisper-large-v3-turbo", {
      audio,
      ...(language ? { language } : {})
    });

    return c.json({ text: result.text });
  }
);
