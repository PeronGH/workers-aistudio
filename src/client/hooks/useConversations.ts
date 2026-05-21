import { useCallback, useEffect, useState } from "react";

export interface ConversationIndexEntry {
  uuid: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

const INDEX_KEY = "wai-studio:conversations";
const ACTIVE_KEY = "wai-studio:active-conversation";

export function useConversations() {
  const [index, setIndex] = useState<ConversationIndexEntry[]>(loadIndex);
  const [activeUuid, setActiveUuid] = useState<string | null>(loadActive);

  useEffect(() => {
    try {
      localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    } catch {
      /* quota — ignore */
    }
  }, [index]);

  useEffect(() => {
    if (activeUuid) localStorage.setItem(ACTIVE_KEY, activeUuid);
    else localStorage.removeItem(ACTIVE_KEY);
  }, [activeUuid]);

  const startNew = useCallback((title: string): string => {
    const uuid = crypto.randomUUID();
    const now = Date.now();
    setIndex((prev) => [
      { uuid, title, createdAt: now, updatedAt: now },
      ...prev
    ]);
    setActiveUuid(uuid);
    return uuid;
  }, []);

  const select = useCallback((uuid: string | null) => {
    setActiveUuid(uuid);
  }, []);

  const remove = useCallback((uuid: string) => {
    setIndex((prev) => prev.filter((e) => e.uuid !== uuid));
    setActiveUuid((prev) => (prev === uuid ? null : prev));
  }, []);

  const touch = useCallback((uuid: string) => {
    setIndex((prev) =>
      prev.map((e) => (e.uuid === uuid ? { ...e, updatedAt: Date.now() } : e))
    );
  }, []);

  return { index, activeUuid, startNew, select, remove, touch };
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

function loadActive(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}
