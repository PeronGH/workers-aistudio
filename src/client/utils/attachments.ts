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

export async function uploadImage(file: File): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "content-type": file.type },
    body: file
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${body || res.statusText}`);
  }
  const { url } = (await res.json()) as { url: string };
  return new URL(url, window.location.origin).toString();
}
