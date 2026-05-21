import { z } from "zod";

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

export type UserMessage = z.infer<typeof UserMessageSchema>;
export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;
export type SystemMessage = z.infer<typeof SystemMessageSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type UserContentPart = z.infer<typeof UserContentPartSchema>;

// What the client renders. Server never sees this — it gets converted to
// API-shaped ChatMessages before POST.
export interface UiAssistantMessage {
  id: string;
  role: "assistant";
  content: string;
  reasoning?: string;
}

export interface UiUserMessage {
  id: string;
  role: "user";
  text: string;
  images: { url: string; mediaType: string }[];
}

export type UiMessage = UiUserMessage | UiAssistantMessage;
