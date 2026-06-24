import { useCallback } from "react";
import { useLocalIndex } from "./useLocalIndex";

const INDEX_KEY = "wai-studio:playground";
const CONTENT_PREFIX = "wai-studio:playground:";

export function usePlaygroundStore() {
  const { index, add, remove } = useLocalIndex(INDEX_KEY);

  const load = useCallback((uuid: string): string => {
    try {
      return localStorage.getItem(CONTENT_PREFIX + uuid) ?? "";
    } catch {
      return "";
    }
  }, []);

  // Content-addressed: identical text dedupes to the same immutable entry.
  const create = useCallback(
    async (text: string): Promise<{ id: string; existed: boolean }> => {
      const id = await hashText(text);
      const existed = localStorage.getItem(CONTENT_PREFIX + id) !== null;
      try {
        localStorage.setItem(CONTENT_PREFIX + id, text);
      } catch {
        /* quota — ignore */
      }
      add(id, deriveTitle(text));
      return { id, existed };
    },
    [add]
  );

  const del = useCallback(
    (uuid: string) => {
      remove(uuid);
      try {
        localStorage.removeItem(CONTENT_PREFIX + uuid);
      } catch {
        /* ignore */
      }
    },
    [remove]
  );

  return { index, create, load, del };
}

const TITLE_MAX = 40;

function deriveTitle(text: string): string {
  return text.split("\n")[0].slice(0, TITLE_MAX) || "Untitled";
}

async function hashText(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
