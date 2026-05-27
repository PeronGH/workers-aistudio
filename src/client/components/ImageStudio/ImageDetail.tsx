import { Text } from "@cloudflare/kumo";
import {
  IMAGE_MODEL_LABELS,
  type ImageGenerationEntry
} from "../../../shared/images";
import { formatRelative } from "../../utils/relativeTime";

interface ImageDetailProps {
  entry: ImageGenerationEntry;
}

export function ImageDetail({ entry }: ImageDetailProps) {
  return (
    <div className="max-w-4xl mx-auto w-full px-5 py-6 space-y-5">
      <div className="rounded-xl border border-kumo-line bg-kumo-base overflow-hidden">
        <img
          src={`/api/images/${entry.id}`}
          alt={entry.prompt}
          className="w-full h-auto bg-kumo-control"
        />
      </div>
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-kumo-subtle">
          <span className="px-2 py-0.5 rounded-full bg-kumo-control border border-kumo-line">
            {IMAGE_MODEL_LABELS[entry.model]}
          </span>
          <span>
            {entry.width}×{entry.height}
          </span>
          <span>· {entry.steps} steps</span>
          <span>· {formatRelative(entry.createdAt)}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm text-kumo-default">
          {entry.prompt}
        </p>
      </section>
      {entry.referenceKeys.length > 0 && (
        <section className="space-y-2">
          <Text size="xs" bold variant="secondary">
            References
          </Text>
          <div className="flex gap-2 flex-wrap">
            {entry.referenceKeys.map((key) => (
              <a
                key={key}
                href={`/api/upload/${key}`}
                target="_blank"
                rel="noreferrer"
                className="block h-20 w-20 rounded-md border border-kumo-line overflow-hidden bg-kumo-control"
              >
                <img
                  src={`/api/upload/${key}`}
                  alt="reference"
                  className="h-full w-full object-cover"
                />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
