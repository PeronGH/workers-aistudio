import { Hono } from "hono";
import { chatHandler, chatValidator } from "./chat";
import {
  conversationBodyValidator,
  deleteConversationHandler,
  getConversationHandler,
  putConversationHandler,
  uuidParamValidator
} from "./conversations";
import { serveUploadHandler, uploadHandler } from "./upload";

const MODEL = "@cf/moonshotai/kimi-k2.6";

const app = new Hono<{ Bindings: Env }>();

app.post("/api/chat", chatValidator, (c) => chatHandler(c, MODEL));

app.post("/api/upload", uploadHandler);
app.get("/api/upload/:key", serveUploadHandler);

app
  .get("/api/conversations/:uuid", uuidParamValidator, getConversationHandler)
  .put(
    "/api/conversations/:uuid",
    uuidParamValidator,
    conversationBodyValidator,
    putConversationHandler
  )
  .delete(
    "/api/conversations/:uuid",
    uuidParamValidator,
    deleteConversationHandler
  );

app.notFound((c) => c.text("Not found", 404));

export default app;
