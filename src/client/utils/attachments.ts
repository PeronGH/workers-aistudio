export interface AttachmentUpload {
  url: string;
  mediaType: string;
}

export type AttachmentStatus = "uploading" | "ready" | "error";

export interface Attachment {
  id: string;
  file: File;
  preview: string;
  status: AttachmentStatus;
  /** Send payload, populated once the upload (or data-URL encode) resolves. */
  result?: AttachmentUpload;
  error?: string;
}

export function createAttachment(file: File): Attachment {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    preview: URL.createObjectURL(file),
    status: "uploading"
  };
}

export interface UploadedImage {
  id: string;
  url: string;
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  const res = await fetch("/api/images", {
    method: "POST",
    headers: { "content-type": file.type },
    body: file
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${body || res.statusText}`);
  }
  const { id, url } = (await res.json()) as { id: string; url: string };
  return { id, url: new URL(url, window.location.origin).toString() };
}

export async function imageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Image did not produce a data URL"));
      }
    };
    reader.readAsDataURL(file);
  });
}
