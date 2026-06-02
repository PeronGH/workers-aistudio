import { Button, Text } from "@cloudflare/kumo";
import { ImageSquareIcon, TrashIcon } from "@phosphor-icons/react";
import {
  IMAGE_MODEL_LABELS,
  type ImageGenerationEntry
} from "../../../shared/images";
import { formatRelative } from "../../utils/relativeTime";

interface ImageSidebarListProps {
  entries: ImageGenerationEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ImageSidebarList({
  entries,
  activeId,
  onSelect,
  onDelete
}: ImageSidebarListProps) {
  return (
    <ul className="flex-1 overflow-y-auto p-2 space-y-1">
      {entries.length === 0 && (
        <li className="px-2 py-6 text-center">
          <Text size="xs" variant="secondary">
            No images yet.
          </Text>
        </li>
      )}
      {entries.map((entry) => (
        <ImageRow
          key={entry.id}
          entry={entry}
          active={entry.id === activeId}
          onSelect={() => onSelect(entry.id)}
          onDelete={() => onDelete(entry.id)}
        />
      ))}
    </ul>
  );
}

function ImageRow({
  entry,
  active,
  onSelect,
  onDelete
}: {
  entry: ImageGenerationEntry;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const label = entry.prompt.trim() || "Untitled";
  return (
    <li
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-1 pr-1 rounded-md transition-colors border-l-2 ${
        active
          ? "border-kumo-brand bg-kumo-brand/10"
          : "border-transparent hover:bg-kumo-control/50"
      }`}
    >
      <Button
        variant="ghost"
        size="xs"
        onClick={onSelect}
        className="h-auto flex-1 min-w-0 justify-start gap-2 rounded-none bg-transparent pl-2 pr-1 py-1.5 text-left font-normal shadow-none hover:bg-transparent"
      >
        <div className="shrink-0 h-9 w-9 rounded-md border border-kumo-line overflow-hidden bg-kumo-control">
          <img
            src={`/api/images/${entry.id}`}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <ImageSquareIcon
              size={11}
              className={
                active
                  ? "text-kumo-brand shrink-0"
                  : "text-kumo-inactive shrink-0"
              }
            />
            <span className="truncate text-[10px] uppercase tracking-wide text-kumo-subtle">
              {IMAGE_MODEL_LABELS[entry.model]}
            </span>
          </div>
          <div
            className={`truncate text-sm ${active ? "font-medium text-kumo-default" : "font-normal text-kumo-default/80"}`}
          >
            {label}
          </div>
          <div className="text-[10px] text-kumo-subtle">
            {formatRelative(entry.createdAt)}
          </div>
        </div>
      </Button>
      <Button
        variant="ghost"
        shape="square"
        size="xs"
        aria-label="Delete image"
        icon={<TrashIcon size={12} />}
        onClick={() => {
          if (confirm("Delete this image?")) onDelete();
        }}
        className="reveal-on-hover text-kumo-inactive hover:text-kumo-danger"
      />
    </li>
  );
}
