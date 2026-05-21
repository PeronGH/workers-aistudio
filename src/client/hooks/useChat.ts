import { useCallback, useEffect, useRef, useState } from "react";
import type { UiMessage } from "../../shared/messages";
import type { RunSettings } from "../../shared/settings";
import { toApiMessages, newId } from "../utils/messages";
import { parseSseStream } from "../utils/sse";

const STORAGE_KEY = "wai-studio:messages";

interface ChatDelta {
  choices?: { delta?: { content?: string; reasoning_content?: string } }[];
}

export interface SendArgs {
  text: string;
  images: { url: string; mediaType: string }[];
  settings: RunSettings;
}

export function useChat() {
  const [messages, setMessages] = useState<UiMessage[]>(() => loadMessages());
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // quota exceeded — silently ignore
    }
  }, [messages]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const clear = useCallback(() => {
    stop();
    setMessages([]);
    setError(null);
  }, [stop]);

  const send = useCallback(
    async ({ text, images, settings }: SendArgs) => {
      if (isStreaming) return;
      const userMsg: UiMessage = {
        id: newId(),
        role: "user",
        text,
        images
      };
      const assistantId = newId();
      const assistantMsg: UiMessage = {
        id: assistantId,
        role: "assistant",
        content: ""
      };
      const next = [...messages, userMsg, assistantMsg];
      setMessages(next);
      setError(null);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const apiMessages = toApiMessages([...messages, userMsg]);
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
          if (event.data === "[DONE]") break;
          let delta: ChatDelta;
          try {
            delta = JSON.parse(event.data);
          } catch {
            continue;
          }
          const piece = delta.choices?.[0]?.delta;
          if (!piece) continue;
          if (piece.content || piece.reasoning_content) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId && m.role === "assistant"
                  ? {
                      ...m,
                      content: m.content + (piece.content ?? ""),
                      reasoning:
                        piece.reasoning_content !== undefined
                          ? (m.reasoning ?? "") + piece.reasoning_content
                          : m.reasoning
                    }
                  : m
              )
            );
          }
        }
      } catch (err) {
        if ((err as { name?: string }).name !== "AbortError") {
          setError((err as Error).message);
        }
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  return { messages, send, stop, clear, isStreaming, error };
}

function loadMessages(): UiMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
