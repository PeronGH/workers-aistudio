import { useCallback, useEffect, useMemo, useState } from "react";

export interface IndexEntry {
  uuid: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export function useLocalIndex(storageKey: string) {
  const [index, setIndex] = useState<IndexEntry[]>(() => load(storageKey));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(index));
    } catch {
      /* quota — ignore */
    }
  }, [storageKey, index]);

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

  const update = useCallback((uuid: string, title: string) => {
    setIndex((prev) =>
      prev.map((e) =>
        e.uuid === uuid ? { ...e, title, updatedAt: Date.now() } : e
      )
    );
  }, []);

  return useMemo(
    () => ({ index, add, remove, touch, update }),
    [index, add, remove, touch, update]
  );
}

function load(key: string): IndexEntry[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
