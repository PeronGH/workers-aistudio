import { useCallback, useRef, useState } from "react";
import type { RunSettings } from "../../shared/settings";
import { parseSseStream } from "../utils/sse";
import { api } from "../utils/api";
import { toastError } from "../utils/toast";

interface CompletionDelta {
  choices?: { text?: string }[];
}

export function useCompletion() {
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    streamingRef.current = false;
    setIsStreaming(false);
  }, []);

  const generate = useCallback(
    async (
      currentText: string,
      cursorPos: number | null,
      settings: RunSettings
    ) => {
      if (streamingRef.current) return;

      const prompt =
        cursorPos !== null ? currentText.slice(0, cursorPos) : currentText;
      const suffix = cursorPos !== null ? currentText.slice(cursorPos) : "";
      let insertPos = cursorPos ?? currentText.length;

      if (!prompt) return;

      const controller = new AbortController();
      abortRef.current = controller;
      streamingRef.current = true;
      setIsStreaming(true);

      let generated = "";

      try {
        const res = await api.api.completion.$post(
          { json: { prompt, settings } },
          { init: { signal: controller.signal } }
        );
        if (!res.ok || !res.body) {
          const body = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${body || res.statusText}`);
        }
        for await (const event of parseSseStream(res.body)) {
          if (event.data === "[DONE]") break;
          let delta: CompletionDelta;
          try {
            delta = JSON.parse(event.data);
          } catch {
            continue;
          }
          const piece = delta.choices?.[0]?.text ?? "";
          if (!piece) continue;
          generated += piece;
          const before = prompt + generated;
          setText(before + suffix);
          insertPos = before.length;
        }
      } catch (err) {
        if ((err as { name?: string }).name !== "AbortError") {
          toastError("Generation failed", (err as Error).message);
        }
      } finally {
        abortRef.current = null;
        streamingRef.current = false;
        setIsStreaming(false);
      }

      return insertPos;
    },
    []
  );

  return { text, setText, generate, stop, isStreaming };
}
