import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_IMAGE_SETTINGS,
  ImageSettingsSchema,
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
    setSettings((prev) => ({ ...prev, ...patch }));
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
