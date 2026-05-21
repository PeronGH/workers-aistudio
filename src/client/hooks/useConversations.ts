import { useCallback, useEffect, useState } from "react";

export interface ConversationIndexEntry {
  uuid: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

const INDEX_KEY = "wai-studio:conversations";

export function useConversations() {
  const [index, setIndex] = useState<ConversationIndexEntry[]>(loadIndex);

  useEffect(() => {
    try {
      localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    } catch {
      /* quota — ignore */
    }
  }, [index]);

  const add = useCallback((uuid: string, title: string) => {
    const now = Date.now();
    setIndex((prev) => [
      { uuid, title, createdAt: now, updatedAt: now },
      ...prev
    ]);
  }, []);

  const remove = useCallback((uuid: string) => {
    setIndex((prev) => prev.filter((e) => e.uuid !== uuid));
  }, []);

  const touch = useCallback((uuid: string) => {
    setIndex((prev) =>
      prev.map((e) => (e.uuid === uuid ? { ...e, updatedAt: Date.now() } : e))
    );
  }, []);

  return { index, add, remove, touch };
}

function loadIndex(): ConversationIndexEntry[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
