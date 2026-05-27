import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import {
  ImageGenerationEntrySchema,
  type ImageGenerationEntry
} from "../../shared/images";

const STORAGE_KEY = "wai-studio:images";
const StoredSchema = z.array(ImageGenerationEntrySchema);

export function useImageHistory() {
  const [entries, setEntries] = useState<ImageGenerationEntry[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // quota — ignore
    }
  }, [entries]);

  const add = useCallback((entry: ImageGenerationEntry) => {
    setEntries((prev) => [entry, ...prev]);
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, add, remove };
}

function load(): ImageGenerationEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = StoredSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}
