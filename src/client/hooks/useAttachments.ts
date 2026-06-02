import { useCallback, useRef, useState } from "react";
import {
  createAttachment,
  type Attachment,
  type AttachmentUpload
} from "../utils/attachments";
import { toastError } from "../utils/toast";

export type AttachmentUploader = (file: File) => Promise<AttachmentUpload>;

export function useAttachments(uploader: AttachmentUploader) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  // Always upload with the latest strategy (the uploader changes with mode).
  const uploaderRef = useRef(uploader);
  uploaderRef.current = uploader;

  const add = useCallback((files: FileList | File[]) => {
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    const created = images.map(createAttachment);
    setAttachments((prev) => [...prev, ...created]);
    for (const att of created) {
      uploaderRef.current(att.file).then(
        (result) =>
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === att.id ? { ...a, status: "ready", result } : a
            )
          ),
        (err: unknown) => {
          const message = (err as Error).message;
          toastError("Image upload failed", message);
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === att.id ? { ...a, status: "error", error: message } : a
            )
          );
        }
      );
    }
  }, []);

  const remove = useCallback((id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att) URL.revokeObjectURL(att.preview);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setAttachments((prev) => {
      for (const a of prev) URL.revokeObjectURL(a.preview);
      return [];
    });
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) add(e.dataTransfer.files);
    },
    [add]
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of items) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        add(files);
      }
    },
    [add]
  );

  // Empty is ready; otherwise every attachment must have finished uploading.
  const ready = attachments.every((a) => a.status === "ready");
  const materialize = useCallback(
    (): AttachmentUpload[] =>
      attachments.flatMap((a) => (a.result ? [a.result] : [])),
    [attachments]
  );

  return {
    attachments,
    isDragging,
    ready,
    materialize,
    add,
    remove,
    clear,
    onDragOver,
    onDragLeave,
    onDrop,
    onPaste
  };
}
