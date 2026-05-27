import { useCallback, useState } from "react";
import type { ImageGenerationEntry, ImageSettings } from "../../shared/images";
import { api } from "../utils/api";
import { uploadImage } from "../utils/attachments";

export type ImageReference =
  | { kind: "local"; clientKey: string; file: File; preview: string }
  | { kind: "remote"; id: string };

interface GenerateArgs {
  prompt: string;
  references: ImageReference[];
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
        const referenceIds = await Promise.all(
          references.map(async (r) =>
            r.kind === "remote" ? r.id : (await uploadImage(r.file)).id
          )
        );

        const res = await api.api.images.generate.$post({
          json: { ...settings, prompt, referenceIds }
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
          referenceIds,
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

  const remove = useCallback(async (id: string): Promise<void> => {
    const res = await api.api.images[":id"].$delete({ param: { id } });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Delete failed (${res.status}): ${body || res.statusText}`
      );
    }
  }, []);

  return { generate, remove, isGenerating };
}
