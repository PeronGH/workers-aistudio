import { useCallback, useEffect, useState } from "react";
import { RunSettingsSchema, type RunSettings } from "../../shared/settings";

const STORAGE_KEY = "wai-studio:settings";

export function useRunSettings() {
  const [settings, setSettings] = useState<RunSettings>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // quota exceeded — silently ignore
    }
  }, [settings]);

  const update = useCallback(
    (patch: Partial<RunSettings> | ((prev: RunSettings) => RunSettings)) => {
      setSettings((prev) => {
        const next =
          typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
        // Strip undefined keys so JSON stays clean and "unset" is a real absence
        const cleaned: RunSettings = {};
        for (const [k, v] of Object.entries(next)) {
          if (v !== undefined) (cleaned as Record<string, unknown>)[k] = v;
        }
        return cleaned;
      });
    },
    []
  );

  const reset = useCallback(() => setSettings({}), []);

  const replace = useCallback((next: RunSettings) => setSettings(next), []);

  return { settings, update, reset, replace };
}

function load(): RunSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = RunSettingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}
