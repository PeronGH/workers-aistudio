import { handleChat } from "./chat";

const MODEL = "@cf/moonshotai/kimi-k2.6";

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChat(request, env, MODEL);
    }
    return new Response("Not found", { status: 404 });
  }
} satisfies ExportedHandler<Env>;
