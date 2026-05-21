import { z } from "zod";

// ── API-shape messages (the model's wire format) ─────────────────────────

const TextPartSchema = z.object({
  type: z.literal("text"),
  text: z.string()
});

const ImagePartSchema = z.object({
  type: z.literal("image_url"),
  image_url: z.object({
    url: z.string(),
    detail: z.enum(["auto", "low", "high"]).optional()
  })
});

const UserContentPartSchema = z.union([TextPartSchema, ImagePartSchema]);

export const UserMessageSchema = z.object({
  role: z.literal("user"),
  content: z.union([z.string(), z.array(UserContentPartSchema).min(1)])
});

export const AssistantMessageSchema = z.object({
  role: z.literal("assistant"),
  content: z.string()
});

export const SystemMessageSchema = z.object({
  role: z.literal("system"),
  content: z.string()
});

export const ChatMessageSchema = z.union([
  UserMessageSchema,
  AssistantMessageSchema,
  SystemMessageSchema
]);

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type UserMessage = z.infer<typeof UserMessageSchema>;
export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;
export type SystemMessage = z.infer<typeof SystemMessageSchema>;
export type UserContentPart = z.infer<typeof UserContentPartSchema>;

// ── UI-shape messages (what the client renders and what we persist) ──────

const UiImageSchema = z.object({
  url: z.string(),
  mediaType: z.string()
});

export const UiUserMessageSchema = z.object({
  id: z.string(),
  role: z.literal("user"),
  text: z.string(),
  images: z.array(UiImageSchema)
});

export const UiAssistantMessageSchema = z.object({
  id: z.string(),
  role: z.literal("assistant"),
  content: z.string(),
  reasoning: z.string().optional()
});

export const UiMessageSchema = z.union([
  UiUserMessageSchema,
  UiAssistantMessageSchema
]);

export type UiUserMessage = z.infer<typeof UiUserMessageSchema>;
export type UiAssistantMessage = z.infer<typeof UiAssistantMessageSchema>;
export type UiMessage = z.infer<typeof UiMessageSchema>;

// ── Message tree node ────────────────────────────────────────────────────

export const MessageNodeSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  message: UiMessageSchema,
  childIds: z.array(z.string()),
  selectedChildId: z.string().nullable()
});

export type MessageNode = z.infer<typeof MessageNodeSchema>;

// ── Shape conversion ─────────────────────────────────────────────────────

export function toApiMessages(messages: UiMessage[]): ChatMessage[] {
  return messages.map((m) => {
    if (m.role === "assistant") {
      return { role: "assistant", content: m.content };
    }
    if (m.images.length === 0) {
      return { role: "user", content: m.text };
    }
    const parts: UserContentPart[] = [];
    if (m.text) parts.push({ type: "text", text: m.text });
    for (const img of m.images) {
      parts.push({ type: "image_url", image_url: { url: img.url } });
    }
    return { role: "user", content: parts };
  });
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
