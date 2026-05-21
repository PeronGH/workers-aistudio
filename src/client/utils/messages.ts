import type {
  ChatMessage,
  UiMessage,
  UserContentPart
} from "../../shared/messages";

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
