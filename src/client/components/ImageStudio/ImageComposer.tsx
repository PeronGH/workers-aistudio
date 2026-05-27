import { useRef } from "react";
import { Button, InputArea, Loader } from "@cloudflare/kumo";
import {
  PaperclipIcon,
  PaperPlaneRightIcon,
  XIcon
} from "@phosphor-icons/react";
import { MAX_REFERENCES, PROMPT_MAX } from "../../../shared/images";
import type { ImageReference } from "../../hooks/useImageGeneration";

interface ImageComposerProps {
  prompt: string;
  onPromptChange: (next: string) => void;
  references: ImageReference[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveReference: (ref: ImageReference) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onSubmit: () => void;
  isGenerating: boolean;
}

export function ImageComposer({
  prompt,
  onPromptChange,
  references,
  onAddFiles,
  onRemoveReference,
  onPaste,
  onSubmit,
  isGenerating
}: ImageComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const remaining = MAX_REFERENCES - references.length;

  const guardedAdd = (files: FileList | File[]) => {
    const list = Array.from(files);
    if (remaining <= 0) return;
    onAddFiles(list.slice(0, remaining));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="max-w-4xl mx-auto px-5 py-4"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        aria-label="Attach reference images"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) guardedAdd(e.target.files);
          e.target.value = "";
        }}
      />

      {references.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {references.map((ref) => (
            <ReferenceThumb
              key={refKey(ref)}
              reference={ref}
              onRemove={() => onRemoveReference(ref)}
            />
          ))}
        </div>
      )}

      <div className="flex items-end gap-3 rounded-xl border border-kumo-line bg-kumo-base p-3 shadow-sm focus-within:ring-2 focus-within:ring-kumo-ring focus-within:border-transparent transition-shadow">
        <Button
          type="button"
          variant="ghost"
          shape="square"
          aria-label="Attach reference images"
          icon={<PaperclipIcon size={18} />}
          onClick={() => fileInputRef.current?.click()}
          disabled={isGenerating || remaining <= 0}
          title={
            remaining <= 0
              ? `Up to ${MAX_REFERENCES} reference images`
              : "Attach reference images"
          }
          className="mb-0.5"
        />
        <InputArea
          value={prompt}
          onValueChange={onPromptChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }}
          onPaste={onPaste}
          placeholder={
            references.length > 0
              ? "Describe how to use the reference images…"
              : "Describe the image you want…"
          }
          disabled={isGenerating}
          rows={1}
          maxLength={PROMPT_MAX}
          className="flex-1 min-w-0 font-mono ring-0! focus:ring-0! shadow-none! bg-transparent! outline-none! resize-none max-h-40"
        />
        <Button
          type="submit"
          variant="primary"
          shape="square"
          aria-label="Generate image"
          disabled={isGenerating || !prompt.trim()}
          icon={
            isGenerating ? (
              <Loader size="sm" />
            ) : (
              <PaperPlaneRightIcon size={18} />
            )
          }
          className="mb-0.5"
        />
      </div>
    </form>
  );
}

function ReferenceThumb({
  reference,
  onRemove
}: {
  reference: ImageReference;
  onRemove: () => void;
}) {
  const src =
    reference.kind === "local"
      ? reference.preview
      : `/api/images/${reference.id}`;
  const alt =
    reference.kind === "local" ? reference.file.name : "Reference image";
  return (
    <div className="relative group rounded-lg border border-kumo-line bg-kumo-control overflow-hidden">
      <img src={src} alt={alt} className="h-16 w-16 object-cover" />
      <Button
        variant="secondary"
        shape="circle"
        size="xs"
        aria-label={`Remove ${alt}`}
        icon={<XIcon size={10} />}
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
}

function refKey(ref: ImageReference): string {
  return ref.kind === "local" ? `local:${ref.clientKey}` : `remote:${ref.id}`;
}
