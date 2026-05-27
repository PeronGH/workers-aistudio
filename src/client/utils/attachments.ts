export interface Attachment {
  id: string;
  file: File;
  preview: string;
  mediaType: string;
}

export function createAttachment(file: File): Attachment {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    preview: URL.createObjectURL(file),
    mediaType: file.type || "application/octet-stream"
  };
}

export interface UploadedImage {
  key: string;
  url: string;
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "content-type": file.type },
    body: file
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${body || res.statusText}`);
  }
  const { key, url } = (await res.json()) as { key: string; url: string };
  return { key, url: new URL(url, window.location.origin).toString() };
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
