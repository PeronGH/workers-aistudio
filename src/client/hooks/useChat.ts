import { useCallback, useEffect, useRef, useState } from "react";
import {
  newId,
  toApiMessages,
  type UiAssistantMessage,
  type UiMessage,
  type UiUserMessage
} from "../../shared/messages";
import {
  CURRENT_VERSION,
  type ConversationState
} from "../../shared/conversations";
import type { RunSettings } from "../../shared/settings";
import { parseSseStream } from "../utils/sse";

interface ChatDelta {
  choices?: {
    delta?: { content?: string | null; reasoning_content?: string | null };
  }[];
}

interface SendArgs {
  uuid: string;
  text: string;
  images: { url: string; mediaType: string }[];
  settings: RunSettings;
}

export function useChat(activeUuid: string | null) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<UiMessage[]>([]);
  messagesRef.current = messages;

  // Load on uuid change
  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setError(null);

    if (!activeUuid) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/conversations/${activeUuid}`);
        if (cancelled) return;
        if (res.status === 404) {
          setMessages([]);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const state = (await res.json()) as ConversationState;
        if (cancelled) return;
        setMessages(state.messages);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeUuid]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const send = useCallback(
    async ({ uuid, text, images, settings }: SendArgs): Promise<boolean> => {
      if (isStreaming) return false;

      const userMsg: UiUserMessage = {
        id: newId(),
        role: "user",
        text,
        images
      };
      const assistantId = newId();
      const assistantMsg: UiAssistantMessage = {
        id: assistantId,
        role: "assistant",
        content: ""
      };

      const base = messagesRef.current;
      const afterUser = [...base, userMsg];
      const withAssistantPlaceholder = [...afterUser, assistantMsg];
      setMessages(withAssistantPlaceholder);
      setError(null);
      setIsStreaming(true);

      // User-turn checkpoint (fire-and-forget — durable even if stream is cancelled).
      void putConversation(uuid, afterUser, settings);

      const controller = new AbortController();
      abortRef.current = controller;

      let assistantContent = "";
      let assistantReasoning = "";
      let completedNaturally = false;

      try {
        const apiMessages = toApiMessages(afterUser);
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, settings }),
          signal: controller.signal
        });
        if (!res.ok || !res.body) {
          const body = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${body || res.statusText}`);
        }

        for await (const event of parseSseStream(res.body)) {
          if (event.data === "[DONE]") {
            completedNaturally = true;
            break;
          }
          let delta: ChatDelta;
          try {
            delta = JSON.parse(event.data);
          } catch {
            continue;
          }
          const piece = delta.choices?.[0]?.delta;
          if (!piece) continue;
          const contentChunk = piece.content ?? "";
          const reasoningChunk = piece.reasoning_content ?? "";
          if (!contentChunk && !reasoningChunk) continue;
          assistantContent += contentChunk;
          if (reasoningChunk) assistantReasoning += reasoningChunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId && m.role === "assistant"
                ? {
                    ...m,
                    content: assistantContent,
                    reasoning: assistantReasoning || undefined
                  }
                : m
            )
          );
        }
      } catch (err) {
        if ((err as { name?: string }).name !== "AbortError") {
          setError((err as Error).message);
        }
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }

      if (completedNaturally) {
        const finalAssistant: UiAssistantMessage = {
          id: assistantId,
          role: "assistant",
          content: assistantContent,
          reasoning: assistantReasoning || undefined
        };
        void putConversation(uuid, [...afterUser, finalAssistant], settings);
      }
      return completedNaturally;
    },
    [isStreaming]
  );

  return { messages, send, stop, isStreaming, isLoading, error };
}

async function putConversation(
  uuid: string,
  messages: UiMessage[],
  settings: RunSettings
): Promise<void> {
  const state: ConversationState = {
    version: CURRENT_VERSION,
    messages,
    settings
  };
  try {
    await fetch(`/api/conversations/${uuid}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state)
    });
  } catch {
    // Network error — silently drop. Next successful PUT will overwrite.
  }
}
