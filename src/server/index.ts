import { Hono } from "hono";
import { chatRoutes } from "./chat";
import { conversationRoutes } from "./conversations";
import { transcribeRoutes } from "./transcribe";
import { uploadRoutes } from "./upload";

const routes = new Hono<{ Bindings: Env }>()
  .route("/api/chat", chatRoutes)
  .route("/api/upload", uploadRoutes)
  .route("/api/transcribe", transcribeRoutes)
  .route("/api/conversations", conversationRoutes);

routes.notFound((c) => c.text("Not found", 404));

export type AppType = typeof routes;
export default routes;
