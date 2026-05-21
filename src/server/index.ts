import { handleChat } from "./chat";
import { handleUpload, serveUpload } from "./upload";

const MODEL = "@cf/moonshotai/kimi-k2.6";

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChat(request, env, MODEL);
    }
    if (url.pathname === "/api/upload" && request.method === "POST") {
      return handleUpload(request, env);
    }
    if (url.pathname.startsWith("/api/upload/") && request.method === "GET") {
      const key = decodeURIComponent(url.pathname.slice("/api/upload/".length));
      return serveUpload(key, env);
    }
    return new Response("Not found", { status: 404 });
  }
} satisfies ExportedHandler<Env>;
