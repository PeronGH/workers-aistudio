import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_IMAGE_SETTINGS,
  ImageSettingsSchema,
  STEPS_RANGES,
  type ImageSettings
} from "../../shared/images";

const STORAGE_KEY = "wai-studio:image-settings";

export function useImageSettings() {
  const [settings, setSettings] = useState<ImageSettings>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // quota — ignore
    }
  }, [settings]);

  const update = useCallback((patch: Partial<ImageSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      // Snap steps to the new model's default when the model changes;
      // dev's 28–50 and klein's 4–8 don't overlap, so carrying the old
      // value across is always wrong.
      if (
        patch.model &&
        patch.model !== prev.model &&
        patch.steps === undefined
      ) {
        next.steps = STEPS_RANGES[patch.model].default;
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_IMAGE_SETTINGS), []);

  return { settings, update, reset };
}

function load(): ImageSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_IMAGE_SETTINGS;
    const parsed = ImageSettingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_IMAGE_SETTINGS;
  } catch {
    return DEFAULT_IMAGE_SETTINGS;
  }
}
