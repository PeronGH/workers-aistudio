import { useCallback, useState } from "react";
import type { ImageGenerationEntry, ImageSettings } from "../../shared/images";
import { api } from "../utils/api";
import { uploadImage, type Attachment } from "../utils/attachments";

interface GenerateArgs {
  prompt: string;
  references: Attachment[];
  settings: ImageSettings;
}

export function useImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(
    async ({
      prompt,
      references,
      settings
    }: GenerateArgs): Promise<ImageGenerationEntry> => {
      setIsGenerating(true);
      try {
        const referenceKeys = await Promise.all(
          references.map(async (r) => (await uploadImage(r.file)).key)
        );

        const res = await api.api.images.$post({
          json: { ...settings, prompt, referenceKeys }
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(
            `Generation failed (${res.status}): ${body || res.statusText}`
          );
        }
        const { id } = (await res.json()) as { id: string };

        return {
          id,
          prompt,
          referenceKeys,
          model: settings.model,
          width: settings.width,
          height: settings.height,
          steps: settings.steps,
          createdAt: Date.now()
        };
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const remove = useCallback(
    async (entry: ImageGenerationEntry): Promise<void> => {
      const query =
        entry.referenceKeys.length > 0
          ? { references: entry.referenceKeys.join(",") }
          : {};
      const res = await api.api.images[":id"].$delete({
        param: { id: entry.id },
        query
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `Delete failed (${res.status}): ${body || res.statusText}`
        );
      }
    },
    []
  );

  return { generate, remove, isGenerating };
}
