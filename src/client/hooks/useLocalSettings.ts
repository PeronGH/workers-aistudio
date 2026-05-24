import { useCallback, useEffect, useState } from "react";
import { LocalSettingsSchema, type LocalSettings } from "../../shared/settings";

const STORAGE_KEY = "wai-studio:local-settings";

export function useLocalSettings() {
  const [settings, setSettings] = useState<LocalSettings>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // quota exceeded — silently ignore
    }
  }, [settings]);

  const update = useCallback((patch: Partial<LocalSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      const cleaned: LocalSettings = {};
      for (const [k, v] of Object.entries(next)) {
        if (v !== undefined) (cleaned as Record<string, unknown>)[k] = v;
      }
      return cleaned;
    });
  }, []);

  return { settings, update };
}

function load(): LocalSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = LocalSettingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}
