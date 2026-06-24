import { Hono } from "hono";
import { chatRoutes } from "./chat";
import { completionRoutes } from "./completion";
import { conversationRoutes } from "./conversations";
import { imageRoutes } from "./images";
import { transcribeRoutes } from "./transcribe";

const routes = new Hono<{ Bindings: Env }>()
  .route("/api/chat", chatRoutes)
  .route("/api/completion", completionRoutes)
  .route("/api/images", imageRoutes)
  .route("/api/transcribe", transcribeRoutes)
  .route("/api/conversations", conversationRoutes);

routes.notFound((c) => c.text("Not found", 404));

export type AppType = typeof routes;
export default routes;
