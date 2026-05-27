import { useCallback, useState } from "react";
import type { ImageGenerationEntry } from "../../shared/images";
import { api } from "../utils/api";
import { uploadImage } from "../utils/attachments";
import type { ImageDraft } from "./useImageDraft";

export function useImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(
    async (draft: ImageDraft): Promise<ImageGenerationEntry> => {
      setIsGenerating(true);
      try {
        const referenceIds = await Promise.all(
          draft.references.map(async (r) =>
            r.kind === "remote" ? r.id : (await uploadImage(r.file)).id
          )
        );

        const res = await api.api.images.generate.$post({
          json: {
            prompt: draft.prompt,
            model: draft.model,
            width: draft.width,
            height: draft.height,
            steps: draft.steps,
            referenceIds
          }
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
          prompt: draft.prompt,
          referenceIds,
          model: draft.model,
          width: draft.width,
          height: draft.height,
          steps: draft.steps,
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
