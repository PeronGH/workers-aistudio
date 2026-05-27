import { Badge, Button, Text } from "@cloudflare/kumo";
import { ArrowBendUpLeftIcon } from "@phosphor-icons/react";
import {
  IMAGE_MODEL_LABELS,
  type ImageGenerationEntry
} from "../../../shared/images";
import { formatRelative } from "../../utils/relativeTime";

interface ImageDetailProps {
  entry: ImageGenerationEntry;
  onUseAsReference: (id: string) => void;
}

export function ImageDetail({ entry, onUseAsReference }: ImageDetailProps) {
  return (
    <div className="max-w-4xl mx-auto w-full px-5 py-6 space-y-5">
      <ImageWithReuseAction
        id={entry.id}
        alt={entry.prompt}
        onUseAsReference={onUseAsReference}
        className="rounded-xl border border-kumo-line bg-kumo-base"
        imgClassName="w-full h-auto bg-kumo-control"
      />
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-kumo-subtle">
          <Badge variant="outline">{IMAGE_MODEL_LABELS[entry.model]}</Badge>
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
      {entry.referenceIds.length > 0 && (
        <section className="space-y-2">
          <Text size="xs" bold variant="secondary">
            References
          </Text>
          <div className="flex gap-2 flex-wrap">
            {entry.referenceIds.map((id) => (
              <ImageWithReuseAction
                key={id}
                id={id}
                alt="reference"
                onUseAsReference={onUseAsReference}
                className="h-20 w-20 rounded-md border border-kumo-line bg-kumo-control"
                imgClassName="h-full w-full object-cover"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ImageWithReuseAction({
  id,
  alt,
  onUseAsReference,
  className,
  imgClassName
}: {
  id: string;
  alt: string;
  onUseAsReference: (id: string) => void;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={`group relative overflow-hidden ${className ?? ""}`}>
      <img src={`/api/images/${id}`} alt={alt} className={imgClassName} />
      <Button
        variant="secondary"
        shape="square"
        size="xs"
        aria-label="Use as reference"
        title="Use as reference"
        icon={<ArrowBendUpLeftIcon size={12} />}
        onClick={() => onUseAsReference(id)}
        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity bg-kumo-base/90 backdrop-blur-sm shadow-sm"
      />
    </div>
  );
}
